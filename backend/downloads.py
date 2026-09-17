"""Bounded, expiring MIDI storage. Owns its lock and accepts a test clock."""
import threading
import time
import uuid


class DownloadStore:
    def __init__(self, ttl=3600, capacity=100, clock=time.monotonic):
        if ttl <= 0 or capacity < 1:
            raise ValueError("ttl and capacity must be positive")
        self.ttl, self.capacity, self.clock = ttl, capacity, clock
        self._entries = {}
        self._lock = threading.Lock()

    def add(self, content, name):
        token = uuid.uuid4().hex
        now = self.clock()
        with self._lock:
            expired = [key for key, entry in self._entries.items() if entry[0] <= now]
            for key in expired:
                del self._entries[key]
            while len(self._entries) >= self.capacity:
                del self._entries[next(iter(self._entries))]
            self._entries[token] = (now + self.ttl, content, name)
        return f"/api/download/{token}"

    def get(self, token):
        with self._lock:
            entry = self._entries.get(token)
            if entry is None or entry[0] <= self.clock():
                self._entries.pop(token, None)
                return None
            return entry[1], entry[2]
