from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime
from .database import Base

class TranslationHistory(Base):
    __tablename__ = "translation_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Original speech/text details
    source_text = Column(Text, nullable=False)
    detected_lang = Column(String(50), nullable=False) # e.g. "Malayalam" or "eng_Latn"
    source_lang_code = Column(String(50), nullable=True) # original Whisper/NLLB code
    
    # Translated details
    translated_text = Column(Text, nullable=False)
    target_lang = Column(String(50), nullable=False) # e.g. "English" or "mal_Mlym"
    target_lang_code = Column(String(50), nullable=True)
    
    # Metrics
    confidence = Column(Float, default=1.0)
    audio_duration = Column(Float, default=0.0) # recording length in seconds
    
    # File storage references
    original_audio_filename = Column(String(255), nullable=True)
    translated_audio_filename = Column(String(255), nullable=True)
    
    # Interaction flags
    is_favorite = Column(Boolean, default=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "source_text": self.source_text,
            "detected_lang": self.detected_lang,
            "source_lang_code": self.source_lang_code,
            "translated_text": self.translated_text,
            "target_lang": self.target_lang,
            "target_lang_code": self.target_lang_code,
            "confidence": round(self.confidence, 4),
            "audio_duration": round(self.audio_duration, 2),
            "original_audio_filename": self.original_audio_filename,
            "translated_audio_filename": self.translated_audio_filename,
            "is_favorite": self.is_favorite
        }
