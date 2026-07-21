'use strict';

const fs = require('fs/promises');
const path = require('path');

/**
 * JsonFileClient
 *
 * The ONLY module in this entire codebase that imports `fs`. Even the
 * repository (order.repository.json.js) doesn't touch fs directly —
 * it asks this client to read/write. Why separate this from the
 * repository at all, instead of just putting fs calls in the
 * repository?
 *
 * Because the repository's job is "translate Order entities <-> raw
 * records" (domain mapping). This client's job is "read/write a JSON
 * array to a path, safely." Conflating them means a future engineer
 * editing serialization logic also has to worry about file locking
 * and atomic writes, and vice versa. Splitting them means:
 *   - Swapping storage to Mongo: delete this file, repository's
 *     mapping logic is reused almost as-is against a Mongo driver.
 *   - Swapping JSON file storage to, say, SQLite-as-a-file: only this
 *     file changes, repository doesn't.
 *
 * Includes a basic write queue to avoid corrupting the file under
 * concurrent writes (Node's single-threaded event loop means this is
 * a real risk with naive read-modify-write on a shared file).
 */
class JsonFileClient {
  constructor(filePath) {
    this.filePath = filePath;
    this._writeQueue = Promise.resolve(); // serializes writes
  }

  async readAll() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw || '[]');
    } catch (err) {
      if (err.code === 'ENOENT') {
        return []; // file doesn't exist yet -> treat as empty collection
      }
      throw err;
    }
  }

  async writeAll(records) {
    // Chain onto the existing queue so concurrent calls don't interleave
    // partial writes against the same file.
    this._writeQueue = this._writeQueue.then(async () => {
      const tmpPath = `${this.filePath}.tmp`;
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(tmpPath, JSON.stringify(records, null, 2), 'utf-8');
      await fs.rename(tmpPath, this.filePath); // atomic on POSIX filesystems
    });
    return this._writeQueue;
  }
}

module.exports = JsonFileClient;
