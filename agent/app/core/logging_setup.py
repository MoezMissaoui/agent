import logging
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

from app.core.config import settings

_done = False


class DailyDateFileHandler(logging.Handler):
    """
    Un fichier par jour : YYYY-MM-DD.log dans log_dir.
    À chaque changement de jour (ou au premier emit), ouvre le bon fichier.
    Supprime les fichiers datés plus vieux que retention_days jours (incluant aujourd'hui).
    """

    terminator = "\n"

    def __init__(
        self,
        log_dir: str | Path,
        retention_days: int = 5,
        encoding: str = "utf-8",
    ) -> None:
        super().__init__()
        self.log_dir = Path(log_dir)
        self.retention_days = max(1, retention_days)
        self.encoding = encoding
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self._stream = None
        self._stream_date: date | None = None
        self._open_today()

    def _purge_old(self) -> None:
        oldest_kept = date.today() - timedelta(days=self.retention_days - 1)
        pat = re.compile(r"^(\d{4}-\d{2}-\d{2})\.log$")
        for p in self.log_dir.iterdir():
            if not p.is_file():
                continue
            m = pat.match(p.name)
            if not m:
                continue
            try:
                fd = datetime.strptime(m.group(1), "%Y-%m-%d").date()
            except ValueError:
                continue
            if fd < oldest_kept:
                try:
                    p.unlink()
                except OSError:
                    pass

    def _open_today(self) -> None:
        today = date.today()
        if self._stream_date == today and self._stream:
            return
        if self._stream:
            self._stream.close()
            self._stream = None
        self._purge_old()
        path = self.log_dir / f"{today.isoformat()}.log"
        self._stream = open(path, "a", encoding=self.encoding)
        self._stream_date = today

    def emit(self, record: logging.LogRecord) -> None:
        try:
            if date.today() != self._stream_date:
                self._open_today()
            msg = self.format(record)
            if self._stream:
                self._stream.write(msg + self.terminator)
                self.flush()
        except Exception:
            self.handleError(record)

    def flush(self) -> None:
        if self._stream:
            self._stream.flush()
        super().flush()

    def close(self) -> None:
        if self._stream:
            self._stream.close()
            self._stream = None
            self._stream_date = None
        super().close()


def _parse_level(name: str) -> int:
    u = name.upper()
    if u == "NOTSET":
        return logging.DEBUG
    lvl = getattr(logging, u, None)
    return lvl if isinstance(lvl, int) else logging.DEBUG


def _attach_daily_file_handler(logger: logging.Logger, fh: DailyDateFileHandler) -> None:
    if any(isinstance(h, DailyDateFileHandler) for h in logger.handlers):
        return
    logger.addHandler(fh)


def configure_app_package_logging() -> None:
    """
    Console stderr pour `app.*`, fichier du jour `LOG_DIR/YYYY-MM-DD.log`,
    rétention LOG_RETENTION_DAYS jours. Handler fichier sur `root` ; `uvicorn.*`
    est forcé en propagate pour que les lignes d’accès HTTP y arrivent aussi.
    Appeler après l’import du module `app` (ex. fin de `main.py`), une fois Uvicorn
    ayant appliqué sa config logging.
    """
    global _done
    if _done:
        return

    level = _parse_level(settings.log_level)
    file_fmt = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_fmt = logging.Formatter("%(levelname)s [%(name)s] %(message)s")

    fh = DailyDateFileHandler(
        settings.log_dir,
        retention_days=settings.log_retention_days,
        encoding="utf-8",
    )
    fh.setLevel(level)
    fh.setFormatter(file_fmt)

    pkg = logging.getLogger("app")
    pkg.setLevel(level)
    if not any(isinstance(h, logging.StreamHandler) for h in pkg.handlers):
        sh = logging.StreamHandler(sys.stderr)
        sh.setLevel(level)
        sh.setFormatter(console_fmt)
        pkg.addHandler(sh)
    # Un seul DailyDateFileHandler sur root : uvicorn.* propage vers root ;
    # évite le double écriture si le même handler est sur uvicorn et root.
    pkg.propagate = True

    # Uvicorn sets propagate=False on these by default, so access/error lines never reached root's file handler.
    for name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        lg = logging.getLogger(name)
        lg.setLevel(level)
        lg.propagate = True

    root = logging.getLogger()
    root.setLevel(level)
    _attach_daily_file_handler(root, fh)

    _done = True
