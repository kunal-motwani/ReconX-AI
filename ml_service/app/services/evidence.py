"""Evidence collection and audit trail utilities."""
from __future__ import annotations

from typing import Any

from app.schemas.common import EvidenceItem


class EvidenceCollector:
    """Collects and organizes evidence for audit trails."""

    def __init__(self):
        self._items: list[EvidenceItem] = []

    def add(
        self,
        source: str,
        field: str = "",
        value: Any = None,
        document_id: str = "",
        transaction_id: str = "",
        description: str = "",
    ) -> None:
        self._items.append(
            EvidenceItem(
                source=source,
                field=field,
                value=value,
                document_id=document_id,
                transaction_id=transaction_id,
                description=description,
            )
        )

    def add_document_ref(self, document_id: str, field: str, value: Any) -> None:
        self.add(source="document", field=field, value=value, document_id=document_id)

    def add_transaction_ref(self, transaction_id: str, field: str, value: Any) -> None:
        self.add(source="transaction", field=field, value=value, transaction_id=transaction_id)

    def add_policy_ref(self, document_id: str, text: str) -> None:
        self.add(source="accounting_policy", field="policy_text", value=text, document_id=document_id)

    def to_list(self) -> list[dict[str, Any]]:
        return [item.model_dump(exclude_none=True) for item in self._items]

    def clear(self) -> None:
        self._items.clear()

    def __len__(self) -> int:
        return len(self._items)
