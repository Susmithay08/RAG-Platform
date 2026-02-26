from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
import uuid
from app.core.database import get_db, Workspace, Document, User
from app.core.auth import get_current_user
from app.services.vector_store import get_workspace_doc_count

router = APIRouter()


class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None


@router.post("/")
async def create_workspace(
    req: WorkspaceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws = Workspace(
        user_id=user.id,
        name=req.name,
        description=req.description,
    )
    db.add(ws)
    await db.commit()
    await db.refresh(ws)
    return {"id": ws.id, "name": ws.name, "description": ws.description, "created_at": ws.created_at}


@router.get("/")
async def list_workspaces(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Workspace)
        .where(Workspace.user_id == user.id)
        .order_by(Workspace.created_at.desc())
    )
    workspaces = result.scalars().all()

    out = []
    for ws in workspaces:
        doc_result = await db.execute(
            select(func.count(Document.id)).where(
                Document.workspace_id == ws.id,
                Document.status == "ready",
            )
        )
        doc_count = doc_result.scalar() or 0
        out.append({
            "id": ws.id,
            "name": ws.name,
            "description": ws.description,
            "doc_count": doc_count,
            "created_at": ws.created_at,
        })
    return out


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws = await db.get(Workspace, workspace_id)
    if not ws or ws.user_id != user.id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    await db.delete(ws)
    await db.commit()
    return {"deleted": True}
