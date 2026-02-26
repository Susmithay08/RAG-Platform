from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, Document, Workspace, User
from app.core.auth import get_current_user
from app.core.config import settings
from app.services.document_processor import process_document
from app.services.vector_store import add_documents, delete_document_chunks
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


async def _process_and_embed(doc_id: str, file_bytes: bytes, file_type: str, workspace_id: str, filename: str):
    """Background task: process document and add to vector store."""
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            chunks = process_document(file_bytes, file_type)
            add_documents(workspace_id, chunks, doc_id, filename)

            doc = await db.get(Document, doc_id)
            if doc:
                doc.status = "ready"
                doc.chunk_count = len(chunks)
                await db.commit()
        except Exception as e:
            logger.error(f"Document processing error: {e}")
            doc = await db.get(Document, doc_id)
            if doc:
                doc.status = "error"
                doc.error_message = str(e)
                await db.commit()


@router.post("/{workspace_id}/upload")
async def upload_document(
    workspace_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify workspace ownership
    ws = await db.get(Workspace, workspace_id)
    if not ws or ws.user_id != user.id:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Validate file
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}")

    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_FILE_SIZE_MB}MB")

    # Save document record
    doc = Document(
        workspace_id=workspace_id,
        user_id=user.id,
        filename=file.filename,
        file_type=ext,
        file_size=len(file_bytes),
        status="processing",
    )
    db.add(doc)

    # Update user stats
    user.total_docs += 1
    await db.commit()
    await db.refresh(doc)

    # Process in background
    background_tasks.add_task(
        _process_and_embed, doc.id, file_bytes, ext, workspace_id, file.filename
    )

    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "created_at": doc.created_at,
    }


@router.get("/{workspace_id}")
async def list_documents(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws = await db.get(Workspace, workspace_id)
    if not ws or ws.user_id != user.id:
        raise HTTPException(status_code=404, detail="Workspace not found")

    result = await db.execute(
        select(Document)
        .where(Document.workspace_id == workspace_id)
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "chunk_count": d.chunk_count,
            "status": d.status,
            "error_message": d.error_message,
            "created_at": d.created_at,
        }
        for d in docs
    ]


@router.delete("/{workspace_id}/{doc_id}")
async def delete_document(
    workspace_id: str,
    doc_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Document, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    delete_document_chunks(workspace_id, doc_id)
    await db.delete(doc)
    await db.commit()
    return {"deleted": True}
