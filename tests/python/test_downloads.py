import unittest
from backend.downloads import DownloadStore

class DownloadStoreTests(unittest.TestCase):
    def test_download_expires_at_ttl_without_sleeping(self):
        now = [10]
        store = DownloadStore(ttl=5, clock=lambda: now[0])
        token = store.add(b'midi', 'test.mid').split('/')[-1]
        self.assertEqual(store.get(token), (b'midi', 'test.mid'))
        now[0] = 15
        self.assertIsNone(store.get(token))

    def test_capacity_evicts_oldest_and_stores_are_independent(self):
        store = DownloadStore(capacity=1)
        first = store.add(b'one', 'one.mid').split('/')[-1]
        second = store.add(b'two', 'two.mid').split('/')[-1]
        self.assertIsNone(store.get(first))
        self.assertEqual(store.get(second), (b'two', 'two.mid'))
        self.assertIsNone(DownloadStore().get(second))
