"""initial schema

Revision ID: d07e61373a6e
Revises: 
Create Date: 2026-08-14 23:53:58.776154

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = 'd07e61373a6e'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("industry", sa.String(), nullable=True),
        sa.Column("website", sa.String(), nullable=True),
    )
    op.create_index("ix_companies_name", "companies", ["name"])

    op.create_table(
        "sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("publisher", sa.String(), nullable=True),
        sa.Column("published_date", sa.DateTime(), nullable=True),
        sa.Column("source_tier", sa.String(), nullable=True),
        sa.Column("retrieved_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "research_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("mode", sa.String(), nullable=False),
        sa.Column("input_text", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("research_job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("research_jobs.id"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=True),
        sa.Column("summary", sa.String(), nullable=True),
        sa.Column("full_content", sa.JSON(), nullable=False),
        sa.Column("overall_confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "claims",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reports.id"), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sources.id"), nullable=False),
        sa.Column("claim_text", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("embedding", Vector(768), nullable=True),
        sa.Column("contradicts_claim_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("claims.id"), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("claims")
    op.drop_table("reports")
    op.drop_table("research_jobs")
    op.drop_table("sources")
    op.drop_index("ix_companies_name", table_name="companies")
    op.drop_table("companies")
    op.drop_table("users")