from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db, QueryLog, Document, Workspace, User
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/")
async def get_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Total workspaces
    ws_result = await db.execute(
        select(func.count(Workspace.id)).where(Workspace.user_id == user.id)
    )
    total_workspaces = ws_result.scalar() or 0

    # Total docs
    doc_result = await db.execute(
        select(func.count(Document.id)).where(
            Document.user_id == user.id,
            Document.status == "ready",
        )
    )
    total_docs = doc_result.scalar() or 0

    # Total queries
    query_result = await db.execute(
        select(func.count(QueryLog.id)).where(QueryLog.user_id == user.id)
    )
    total_queries = query_result.scalar() or 0

    # Avg response time
    avg_result = await db.execute(
        select(func.avg(QueryLog.duration_ms)).where(QueryLog.user_id == user.id)
    )
    avg_duration = avg_result.scalar() or 0

    # Recent queries
    recent_result = await db.execute(
        select(QueryLog)
        .where(QueryLog.user_id == user.id)
        .order_by(QueryLog.created_at.desc())
        .limit(10)
    )
    recent = recent_result.scalars().all()

    return {
        "total_workspaces": total_workspaces,
        "total_docs": total_docs,
        "total_queries": total_queries,
        "avg_duration_ms": round(avg_duration, 1),
        "recent_queries": [
            {
                "query": q.query,
                "workspace_id": q.workspace_id,
                "duration_ms": q.duration_ms,
                "created_at": q.created_at,
            }
            for q in recent
        ],
    }
