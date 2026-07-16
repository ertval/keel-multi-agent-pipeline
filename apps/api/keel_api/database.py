from __future__ import annotations

from sqlalchemy import Column, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Create SQLite database in the api directory
DATABASE_URL = "sqlite:///keel.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class VoyageModel(Base):
    __tablename__ = "voyages"

    id = Column(String, primary_key=True, index=True)
    status = Column(String, nullable=False, default="processing")
    owner_name = Column(String, nullable=True)
    reconciliation_json = Column(Text, nullable=True)
    pdf_urls_json = Column(Text, nullable=True)
