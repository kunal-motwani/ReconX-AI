"""Pipeline service — high-level coordinator used by the orchestrator."""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class PipelineStep:
    name: str
    status: StepStatus = StepStatus.PENDING
    result: Any = None
    error: str | None = None
    start_time: float = 0.0
    end_time: float = 0.0

    @property
    def duration_ms(self) -> float:
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time) * 1000
        return 0.0


@dataclass
class PipelineState:
    """Tracks execution state for a single workflow run."""
    workflow_id: str
    company_id: str = ""
    steps: list[PipelineStep] = field(default_factory=list)
    start_time: float = 0.0
    end_time: float = 0.0

    def add_step(self, name: str) -> PipelineStep:
        step = PipelineStep(name=name)
        self.steps.append(step)
        return step

    def start(self) -> None:
        self.start_time = time.time()

    def finish(self) -> None:
        self.end_time = time.time()

    @property
    def total_duration_ms(self) -> float:
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time) * 1000
        return 0.0

    @property
    def all_succeeded(self) -> bool:
        return all(s.status in (StepStatus.SUCCESS, StepStatus.SKIPPED) for s in self.steps)

    @property
    def overall_status(self) -> str:
        if self.all_succeeded:
            return "success"
        if any(s.status == StepStatus.FAILED for s in self.steps):
            return "partial" if any(s.status == StepStatus.SUCCESS for s in self.steps) else "failed"
        return "running"

    def to_dict(self) -> dict[str, Any]:
        return {
            "workflow_id": self.workflow_id,
            "company_id": self.company_id,
            "status": self.overall_status,
            "total_duration_ms": self.total_duration_ms,
            "steps": [
                {
                    "name": s.name,
                    "status": s.status.value,
                    "duration_ms": s.duration_ms,
                    "error": s.error,
                }
                for s in self.steps
            ],
        }


def run_step(step: PipelineStep, fn, *args, **kwargs) -> Any:
    """Execute a pipeline step with timing and error handling."""
    step.status = StepStatus.RUNNING
    step.start_time = time.time()
    try:
        result = fn(*args, **kwargs)
        step.status = StepStatus.SUCCESS
        step.result = result
        return result
    except Exception as e:
        step.status = StepStatus.FAILED
        step.error = str(e)
        logger.error("Pipeline step '%s' failed: %s", step.name, e)
        return None
    finally:
        step.end_time = time.time()
