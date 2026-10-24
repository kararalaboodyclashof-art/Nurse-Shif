import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'nurseshift_db.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const ROOMS_DIR = path.join(DATA_DIR, 'rooms');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}
if (!fs.existsSync(ROOMS_DIR)) {
  fs.mkdirSync(ROOMS_DIR, { recursive: true });
}

// Initial empty database structure conforming strictly to user request:
// "ابدأ بقاعدة بيانات فارغة، دون أسماء أو جداول أو بيانات طبية افتراضية."
const getEmptyDatabase = () => ({
  version: 1,
  lastUpdated: new Date().toISOString(),
  staff: [] as any[], // Empty initially
  shifts: [] as any[], // Empty initially
  auditLog: [] as any[],
  settings: {
    hospitalName: 'مستشفى الحسين التخصصي للاطفال',
    departmentName: 'Rcu العناية المركزة',
    shiftDurationHours: 18,
    shiftStartTime: '14:00',
    shiftEndTime: '08:00',
    restDaysAfterShift: 3,
    periodsCount: 9,
    periodDurationHours: 2,
    criticalPeriodStart: '02:00',
    criticalPeriodEnd: '07:00',
    supervisorPin: '1234', // default pin for supervisor review
  },
});

// Helper to load DB
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading database file, initializing fresh:', err);
  }
  const empty = getEmptyDatabase();
  saveDatabase(empty);
  return empty;
}

// Helper to save DB atomically
function saveDatabase(data: any) {
  try {
    data.lastUpdated = new Date().toISOString();
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error saving database:', err);
    return false;
  }
}

app.use(express.json({ limit: '20mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'NurseShift',
    time: new Date().toISOString(),
    databaseExists: fs.existsSync(DB_FILE),
  });
});

// Get Database State
app.get('/api/database', (_req, res) => {
  const db = loadDatabase();
  res.json(db);
});

// Update Database State
app.post('/api/database', (req, res) => {
  const { data, reason, author } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Data is required' });
  }

  const currentDb = loadDatabase();
  const auditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    author: author || 'المشرف',
    reason: reason || 'تحديث تلقائي أو تعديل بواسطة المستخدم',
    changesSummary: `تحديث بيانات النظام (${data.staff?.length || 0} موظف، ${data.shifts?.length || 0} خفارة)`,
  };

  const newAuditLog = [auditEntry, ...(currentDb.auditLog || [])].slice(0, 500);
  const updatedData = {
    ...data,
    auditLog: newAuditLog,
    lastUpdated: new Date().toISOString(),
  };

  const success = saveDatabase(updatedData);
  if (success) {
    res.json({ success: true, lastUpdated: updatedData.lastUpdated, auditEntry });
  } else {
    res.status(500).json({ error: 'Failed to write to database storage' });
  }
});

// Live Cloud Sync Room - Push data from supervisor phone
app.post('/api/sync/push', (req, res) => {
  const { roomCode, data, author } = req.body;
  if (!roomCode || typeof roomCode !== 'string' || !data) {
    return res.status(400).json({ error: 'كود المزامنة والبيانات مطلوبة' });
  }
  const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanCode) {
    return res.status(400).json({ error: 'كود المزامنة غير صالح' });
  }

  const roomFilePath = path.join(ROOMS_DIR, `${cleanCode}.json`);
  const payload = {
    roomCode: cleanCode,
    pushedAt: new Date().toISOString(),
    author: author || 'المشرف',
    data,
  };

  try {
    fs.writeFileSync(roomFilePath, JSON.stringify(payload, null, 2), 'utf-8');
    res.json({
      success: true,
      roomCode: cleanCode,
      pushedAt: payload.pushedAt,
      message: 'تم رفع البيانات بنجاح إلى غرفة المزامنة السحابية',
    });
  } catch (err: any) {
    res.status(500).json({ error: `فشل حفظ المزامنة السحابية: ${err.message}` });
  }
});

// Live Cloud Sync Room - Pull data on colleague phone
app.get('/api/sync/pull/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const cleanCode = (roomCode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const roomFilePath = path.join(ROOMS_DIR, `${cleanCode}.json`);

  if (!fs.existsSync(roomFilePath)) {
    return res.status(404).json({ error: 'كود المزامنة غير موجود أو انتهت صلاحيته' });
  }

  try {
    const raw = fs.readFileSync(roomFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    res.json({
      success: true,
      roomCode: cleanCode,
      pushedAt: parsed.pushedAt,
      author: parsed.author,
      data: parsed.data,
    });
  } catch (err: any) {
    res.status(500).json({ error: `فشل قراءة بيانات المزامنة: ${err.message}` });
  }
});

// Reset Database to empty
app.post('/api/database/reset', (req, res) => {
  const { reason, author } = req.body;
  const empty = getEmptyDatabase();
  const auditEntry = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    author: author || 'المشرف العام',
    reason: reason || 'إعادة ضبط قاعدة البيانات إلى الحالة الفارغة المعتمدة',
    changesSummary: 'تصفير شامل للبيانات والجداول',
  };
  empty.auditLog = [auditEntry];
  saveDatabase(empty);
  res.json({ success: true, message: 'Database reset successfully', db: empty });
});

// Create Backup
app.post('/api/database/backup', (req, res) => {
  try {
    const currentDb = loadDatabase();
    const filename = `nurseshift_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const backupPath = path.join(BACKUPS_DIR, filename);
    fs.writeFileSync(backupPath, JSON.stringify(currentDb, null, 2), 'utf-8');
    res.json({ success: true, filename, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List Backups
app.get('/api/database/backups', (_req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          filename: f,
          size: stats.size,
          created: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.created.localeCompare(a.created));
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore Backup from payload
app.post('/api/database/restore', (req, res) => {
  const { backupData, author, reason } = req.body;
  if (!backupData || !Array.isArray(backupData.staff)) {
    return res.status(400).json({ error: 'بيانات النسخة الاحتياطية غير صالحة' });
  }

  const auditEntry = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    author: author || 'المشرف العام',
    reason: reason || 'استرجاع نسخة احتياطية',
    changesSummary: `تم استرجاع نسخة احتياطية تتضمن ${backupData.staff?.length || 0} موظف و${backupData.shifts?.length || 0} خفارة`,
  };

  backupData.auditLog = [auditEntry, ...(backupData.auditLog || [])].slice(0, 500);
  backupData.lastUpdated = new Date().toISOString();

  const success = saveDatabase(backupData);
  if (success) {
    res.json({ success: true, db: backupData });
  } else {
    res.status(500).json({ error: 'فشل حفظ النسخة المسترجعة' });
  }
});

// Vite or Static file serving
async function setupApp() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NurseShift Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
