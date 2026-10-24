import os
import shutil
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import sqlalchemy as sa

from .config import UPLOAD_DIR, TTS_OUTPUT_DIR, SUPPORTED_LANGUAGES, DB_PATH
from .database import get_db, engine, Base
from .models_db import TranslationHistory
from .pipeline import pipeline_singleton
from .utils import clean_and_convert_audio, generate_grammar_correction

# Initialize DB tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app):
    print("[*] Backend starting up ...")
    print(f"[*] SQLite Database: {DB_PATH}")
    yield
    print("[*] Backend shutting down.")

app = FastAPI(
    title="AI Multilingual Voice Translator API",
    description="FastAPI backend for Whisper ASR + NLLB-200 translation.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio streams
app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/static/tts", StaticFiles(directory=str(TTS_OUTPUT_DIR)), name="tts")



@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "current_engine": pipeline_singleton.preferred_engine,
        "nllb_cached": pipeline_singleton.is_nllb_available(),
        "models_cached": {
            "whisper": pipeline_singleton.whisper_model is not None,
            "nllb": pipeline_singleton.nllb_model is not None or pipeline_singleton.is_nllb_available()
        }
    }

@app.get("/api/engine")
def get_engine():
    return {
        "current_engine": pipeline_singleton.preferred_engine,
        "nllb_cached": pipeline_singleton.is_nllb_available(),
        "available_engines": ["auto", "fast", "nllb"]
    }

@app.post("/api/engine")
def set_engine(engine: str = Form(...)):
    if engine not in ["auto", "fast", "nllb"]:
        raise HTTPException(status_code=400, detail="Invalid engine. Must be 'auto', 'fast', or 'nllb'.")
    pipeline_singleton.preferred_engine = engine
    return {"current_engine": pipeline_singleton.preferred_engine, "status": "updated"}

@app.get("/api/languages")
def get_languages():
    """Returns a list of supported languages for the dropdown list."""
    return [
        {
            "code": code,
            "name": info["name"],
            "whisper_code": info["whisper_code"],
            "tts_voice": info["tts_voice"]
        }
        for code, info in SUPPORTED_LANGUAGES.items()
    ]


@app.post("/api/translate-audio")
async def translate_audio(
    file: UploadFile = File(...),
    target_lang: str = Form(...),
    apply_noise_reduction: bool = Form(True),
    db: Session = Depends(get_db)
):
    """
    Accepts audio file, transcribes it, identifies language, 
    translates into target language, and logs to history.
    """
    if target_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported target language code.")

    # Save incoming audio file
    temp_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1] or ".wav"
    input_filename = f"input_{temp_id}{file_ext}"
    input_path = os.path.join(UPLOAD_DIR, input_filename)
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Standardize & clean audio
    cleaned_filename = f"processed_{temp_id}.wav"
    cleaned_path = os.path.join(UPLOAD_DIR, cleaned_filename)
    
    try:
        clean_and_convert_audio(
            input_path=input_path,
            output_path=cleaned_path,
            apply_noise_reduction=apply_noise_reduction
        )
    except Exception as e:
        # Cleanup input file
        if os.path.exists(input_path):
            os.remove(input_path)
        raise HTTPException(status_code=500, detail=f"Failed to process audio: {str(e)}")

    try:
        # Transcribe & Auto-detect language
        transcription_result = pipeline_singleton.transcribe(cleaned_path)
        
        raw_text = transcription_result["text"]
        detected_code = transcription_result["detected_lang_code"]
        detected_name = transcription_result["detected_lang_name"]
        confidence = transcription_result["confidence"]
        duration = transcription_result["duration"]

        # If transcription is empty
        if not raw_text.strip():
            raise HTTPException(status_code=422, detail="No speech detected in audio file.")

        # Grammar & formatting correction
        corrected_text = generate_grammar_correction(raw_text)

        # Translate using NLLB-200
        translated_text = pipeline_singleton.translate(
            text=corrected_text,
            src_lang=detected_code,
            tgt_lang=target_lang
        )

        # Generate Text-To-Speech for target language
        tts_filename = f"tts_{temp_id}.mp3"
        tts_path = os.path.join(TTS_OUTPUT_DIR, tts_filename)
        tts_success = await pipeline_singleton.text_to_speech(
            text=translated_text,
            tgt_lang=target_lang,
            output_path=tts_path
        )
        
        # Save to database
        history_item = TranslationHistory(
            source_text=corrected_text,
            detected_lang=detected_name,
            source_lang_code=detected_code,
            translated_text=translated_text,
            target_lang=SUPPORTED_LANGUAGES[target_lang]["name"],
            target_lang_code=target_lang,
            confidence=confidence,
            audio_duration=duration,
            original_audio_filename=cleaned_filename,
            translated_audio_filename=tts_filename if tts_success else None
        )
        
        db.add(history_item)
        db.commit()
        db.refresh(history_item)

        # Cleanup raw uploaded input file (keep the standardized processed one)
        if os.path.exists(input_path):
            os.remove(input_path)

        return {
            "id": history_item.id,
            "timestamp": history_item.timestamp.isoformat(),
            "source_text": corrected_text,
            "detected_lang": detected_name,
            "source_lang_code": detected_code,
            "translated_text": translated_text,
            "target_lang": SUPPORTED_LANGUAGES[target_lang]["name"],
            "target_lang_code": target_lang,
            "confidence": confidence,
            "duration": duration,
            "audio_url": f"/static/uploads/{cleaned_filename}",
            "tts_url": f"/static/tts/{tts_filename}" if tts_success else None
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        # Cleanup
        if os.path.exists(cleaned_path):
            os.remove(cleaned_path)
        if os.path.exists(input_path):
            os.remove(input_path)
        print(f"[-] Translation pipeline error: {e}")
        raise HTTPException(status_code=500, detail=f"AI pipeline failed: {str(e)}")

@app.post("/api/translate-text")
async def translate_text(
    source_text: str = Form(...),
    source_lang: str = Form(...), # NLLB code or 'auto'
    target_lang: str = Form(...),
    db: Session = Depends(get_db)
):
    """Translates text from source language to target language and synthesizes TTS."""
    if target_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported target language.")
        
    src_code = source_lang
    if source_lang == "auto" or not source_lang:
        src_code = "eng_Latn"
    elif source_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported source language.")

    try:
        corrected_text = generate_grammar_correction(source_text)
        
        # Translate
        translated_text = pipeline_singleton.translate(
            text=corrected_text,
            src_lang=src_code,
            tgt_lang=target_lang
        )
        
        # Generate TTS audio
        temp_id = str(uuid.uuid4())
        tts_filename = f"tts_txt_{temp_id}.mp3"
        tts_path = os.path.join(TTS_OUTPUT_DIR, tts_filename)
        tts_success = await pipeline_singleton.text_to_speech(
            text=translated_text,
            tgt_lang=target_lang,
            output_path=tts_path
        )
        
        # Save to DB
        history_item = TranslationHistory(
            source_text=corrected_text,
            detected_lang=SUPPORTED_LANGUAGES[src_code]["name"],
            source_lang_code=src_code,
            translated_text=translated_text,
            target_lang=SUPPORTED_LANGUAGES[target_lang]["name"],
            target_lang_code=target_lang,
            confidence=1.0,
            audio_duration=0.0,
            original_audio_filename=None,
            translated_audio_filename=tts_filename if tts_success else None
        )
        db.add(history_item)
        db.commit()
        db.refresh(history_item)
        
        result = history_item.to_dict()
        result["tts_url"] = f"/static/tts/{tts_filename}" if tts_success else None
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text translation failed: {str(e)}")


@app.get("/api/tts")
async def get_tts_stream(
    text: str = Query(...),
    target_lang: str = Query(...)
):
    """
    Generates and streams TTS audio file directly without saving to DB.
    Useful for playing audio of edited translations.
    """
    if target_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported target language.")
        
    temp_id = str(uuid.uuid4())
    tts_filename = f"stream_{temp_id}.mp3"
    tts_path = os.path.join(TTS_OUTPUT_DIR, tts_filename)
    
    success = await pipeline_singleton.text_to_speech(
        text=text,
        tgt_lang=target_lang,
        output_path=tts_path
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="TTS generation failed.")
        
    # Return file and delete it after streaming or let it be cleaned up periodically
    return FileResponse(
        path=tts_path,
        media_type="audio/mpeg",
        filename=f"translation_{target_lang}.mp3"
    )

@app.get("/api/history")
def get_history(
    search: str = Query(None),
    favorites_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Fetches list of previous translations, supporting search queries."""
    query = db.query(TranslationHistory)
    
    if favorites_only:
        query = query.filter(TranslationHistory.is_favorite == True)
        
    if search:
        query = query.filter(
            sa.or_(
                TranslationHistory.source_text.ilike(f"%{search}%"),
                TranslationHistory.translated_text.ilike(f"%{search}%"),
                TranslationHistory.detected_lang.ilike(f"%{search}%"),
                TranslationHistory.target_lang.ilike(f"%{search}%")
            )
        )
        
    history = query.order_by(TranslationHistory.timestamp.desc()).all()
    return [item.to_dict() for item in history]

@app.get("/api/history/export")
def export_history(format: str = Query("json"), db: Session = Depends(get_db)):
    """Exports translation history as downloadable CSV or JSON."""
    items = db.query(TranslationHistory).order_by(TranslationHistory.timestamp.desc()).all()
    if format.lower() == "csv":
        import io, csv
        from fastapi.responses import Response
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "Source Language", "Source Text", "Target Language", "Translated Text", "Confidence", "Duration (s)", "Favorite"])
        for it in items:
            writer.writerow([
                it.id,
                it.timestamp.isoformat() if it.timestamp else "",
                it.detected_lang,
                it.source_text,
                it.target_lang,
                it.translated_text,
                round(it.confidence, 4) if it.confidence is not None else 1.0,
                round(it.audio_duration, 2) if it.audio_duration is not None else 0.0,
                it.is_favorite
            ])
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=translation_history_{timestamp_str}.csv"}
        )
    return [it.to_dict() for it in items]


@app.post("/api/history/{item_id}/favorite")
def toggle_favorite(item_id: int, db: Session = Depends(get_db)):
    """Bookmarks/Favorites a specific translation entry."""
    item = db.query(TranslationHistory).filter(TranslationHistory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found.")
    
    item.is_favorite = not item.is_favorite
    db.commit()
    return {"id": item.id, "is_favorite": item.is_favorite}

@app.delete("/api/history/{item_id}")
def delete_history_item(item_id: int, db: Session = Depends(get_db)):
    """Deletes a single translation entry and cleans up files."""
    item = db.query(TranslationHistory).filter(TranslationHistory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found.")
        
    # Cleanup files
    if item.original_audio_filename:
        p_orig = os.path.join(UPLOAD_DIR, item.original_audio_filename)
        if os.path.exists(p_orig):
            os.remove(p_orig)
            
    if item.translated_audio_filename:
        p_tts = os.path.join(TTS_OUTPUT_DIR, item.translated_audio_filename)
        if os.path.exists(p_tts):
            os.remove(p_tts)
            
    db.delete(item)
    db.commit()
    return {"status": "success", "message": f"Deleted history item {item_id}"}

@app.delete("/api/history")
def clear_all_history(db: Session = Depends(get_db)):
    """Clears translation database table and deletes files."""
    try:
        # Delete files in directories
        for f in os.listdir(UPLOAD_DIR):
            os.remove(os.path.join(UPLOAD_DIR, f))
        for f in os.listdir(TTS_OUTPUT_DIR):
            os.remove(os.path.join(TTS_OUTPUT_DIR, f))
            
        db.query(TranslationHistory).delete()
        db.commit()
        return {"status": "success", "message": "History cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Returns analytics metadata and chart series for the dashboard."""
    # Aggregated stats
    total_count = db.query(TranslationHistory).count()
    
    # Calculate duration sum
    total_duration = db.query(sa.func.sum(TranslationHistory.audio_duration)).scalar() or 0.0
    
    # Average confidence
    avg_confidence = db.query(sa.func.avg(TranslationHistory.confidence)).scalar() or 1.0
    
    # Favorites count
    favs_count = db.query(TranslationHistory).filter(TranslationHistory.is_favorite == True).count()
    
    # Estimated time saved (assume 10 seconds saved per translation task)
    time_saved_minutes = round((total_count * 15 + total_duration) / 60, 1)

    # Popular target languages
    popular_langs = db.query(
        TranslationHistory.target_lang,
        sa.func.count(TranslationHistory.id).label("count")
    ).group_by(
        TranslationHistory.target_lang
    ).order_by(
        sa.desc("count")
    ).limit(5).all()
    
    popular_languages_data = [
        {"language": row[0], "count": row[1]} for row in popular_langs
    ]

    # Popular source languages
    popular_src = db.query(
        TranslationHistory.detected_lang,
        sa.func.count(TranslationHistory.id).label("count")
    ).group_by(
        TranslationHistory.detected_lang
    ).order_by(
        sa.desc("count")
    ).limit(5).all()
    
    popular_source_data = [
        {"language": row[0], "count": row[1]} for row in popular_src
    ]

    # Usage timeline (last 7 days)
    timeline_data = []
    today = datetime.utcnow().date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%a")
        
        # Count translations on this day
        count = db.query(TranslationHistory).filter(
            sa.func.date(TranslationHistory.timestamp) == day
        ).count()
        
        timeline_data.append({"day": day_str, "translations": count})

    return {
        "summary": {
            "totalTranslations": total_count,
            "totalDuration": round(total_duration, 1),
            "averageConfidence": round(avg_confidence * 100, 1),
            "favoritesCount": favs_count,
            "timeSavedMinutes": time_saved_minutes
        },
        "charts": {
            "popularLanguages": popular_languages_data,
            "popularSources": popular_source_data,
            "timeline": timeline_data
        }
    }
