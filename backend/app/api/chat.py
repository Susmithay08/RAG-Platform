from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
import time
from app.core.database import get_db, QueryLog, Workspace, User
from app.core.auth import get_current_user
from app.core.rate_limit import check_rate_limit
from app.services.rag import run_rag

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    n_results: int = 5


@router.post("/{workspace_id}")
async def query_workspace(
    workspace_id: str,
    req: QueryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_rate_limit(user.id)

    ws = await db.get(Workspace, workspace_id)
    if not ws or ws.user_id != user.id:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    start = time.time()
    result = await run_rag(workspace_id, req.query, n_results=req.n_results)
    duration_ms = (time.time() - start) * 1000

    # Log query
    log = QueryLog(
        user_id=user.id,
        workspace_id=workspace_id,
        query=req.query,
        answer=result["answer"],
        sources_count=len(result["sources"]),
        duration_ms=round(duration_ms, 2),
    )
    db.add(log)
    user.total_queries += 1
    await db.commit()

    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "duration_ms": round(duration_ms, 2),
    }


@router.get("/{workspace_id}/history")
async def get_history(
    workspace_id: str,
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws = await db.get(Workspace, workspace_id)
    if not ws or ws.user_id != user.id:
        raise HTTPException(status_code=404, detail="Workspace not found")

    result = await db.execute(
        select(QueryLog)
        .where(QueryLog.workspace_id == workspace_id)
        .order_by(QueryLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id": l.id,
            "query": l.query,
            "answer": l.answer,
            "sources_count": l.sources_count,
            "duration_ms": l.duration_ms,
            "created_at": l.created_at,
        }
        for l in logs
    ]
