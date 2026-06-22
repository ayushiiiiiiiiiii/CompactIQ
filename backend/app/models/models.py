from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Device(Base):
    __tablename__ = "devices"
    id = Column(String, primary_key=True, index=True)
    os_name = Column(String)
    os_version = Column(String)
    last_scanned = Column(
        DateTime(
            timezone=True),
        server_default=func.now(),
        onupdate=func.now())
    scan_status = Column(String, default="COMPLETED")
    compliance_score = Column(Integer, default=100)
    components = relationship(
        "DeviceComponent",
        back_populates="device",
        cascade="all, delete-orphan")


class DeviceComponent(Base):
    __tablename__ = "device_components"
    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(String, ForeignKey("devices.id"))
    component_type = Column(String)
    vendor = Column(String)
    version = Column(String)
    device = relationship("Device", back_populates="components")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, unique=True, index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="pending")


class Rule(Base):
    __tablename__ = "rules"
    id = Column(Integer, primary_key=True, autoincrement=True)
    source_component_type = Column(String)
    source_version = Column(String)
    target_component_type = Column(String)
    target_min_version = Column(String, nullable=True)
    target_max_version = Column(String, nullable=True)
    incompatible_version = Column(String, nullable=True)
    rule_type = Column(String)  # REQUIRES or INCOMPATIBLE_WITH
    reason = Column(Text, nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    document = relationship("Document")
