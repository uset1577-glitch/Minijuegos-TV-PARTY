export interface TvInstalledVersion {
  versionCode: number;
  versionName: string;
  canInstall: boolean;
  isNativeTv: boolean;
}

export interface TvRemoteRelease {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  notes?: string;
}

interface NativeApkUpdaterPlugin {
  getVersion: () => Promise<{versionCode: number; versionName: string; canInstall?: boolean}>;
  checkUpdate: (opts: {manifestUrl: string}) => Promise<TvRemoteRelease>;
  downloadAndInstall: (opts: {
    apkUrl: string;
  }) => Promise<{status: 'installed_intent' | 'needs_permission'}>;
  openInstallPermission: () => Promise<void>;
  installCachedApk: () => Promise<{
    status: 'installed_intent' | 'needs_permission' | 'missing';
  }>;
  addListener: (
    eventName: 'downloadProgress',
    cb: (data: {progress: number}) => void,
  ) => Promise<{remove: () => Promise<void>}>;
}

interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: {
      ApkUpdater?: NativeApkUpdaterPlugin;
    };
  };
}

const FALLBACK_VERSION_NAME = import.meta.env.VITE_APP_VERSION || '1.0.0';
const FALLBACK_VERSION_CODE = Number(import.meta.env.VITE_APP_VERSION_CODE || 100);
const MANIFEST_URL = (import.meta.env.VITE_UPDATE_MANIFEST_URL || '').trim();

function getNativePlugin(): NativeApkUpdaterPlugin | null {
  const cap = (window as CapacitorWindow).Capacitor;
  if (!cap?.Plugins?.ApkUpdater) return null;
  if (typeof cap.isNativePlatform === 'function' && !cap.isNativePlatform()) {
    return null;
  }
  return cap.Plugins.ApkUpdater;
}

export function isNativeTvUpdaterAvailable(): boolean {
  return Boolean(getNativePlugin());
}

export function getUpdateManifestUrl(): string {
  return MANIFEST_URL;
}

export async function getInstalledTvVersion(): Promise<TvInstalledVersion> {
  const plugin = getNativePlugin();
  if (!plugin) {
    return {
      versionCode: FALLBACK_VERSION_CODE,
      versionName: FALLBACK_VERSION_NAME,
      canInstall: true,
      isNativeTv: false,
    };
  }
  try {
    const res = await plugin.getVersion();
    return {
      versionCode: Number(res.versionCode || FALLBACK_VERSION_CODE),
      versionName: String(res.versionName || FALLBACK_VERSION_NAME),
      canInstall: res.canInstall !== false,
      isNativeTv: true,
    };
  } catch {
    return {
      versionCode: FALLBACK_VERSION_CODE,
      versionName: FALLBACK_VERSION_NAME,
      canInstall: true,
      isNativeTv: true,
    };
  }
}

export type TvUpdateCheckResult =
  | {status: 'web_only'; local: TvInstalledVersion}
  | {status: 'no_feed'; local: TvInstalledVersion}
  | {status: 'up_to_date'; local: TvInstalledVersion}
  | {status: 'update_available'; local: TvInstalledVersion; remote: TvRemoteRelease}
  | {status: 'error'; local: TvInstalledVersion; message: string};

export async function checkForTvUpdate(): Promise<TvUpdateCheckResult> {
  const local = await getInstalledTvVersion();
  const plugin = getNativePlugin();
  if (!plugin) {
    return {status: 'web_only', local};
  }
  if (!MANIFEST_URL) {
    return {status: 'no_feed', local};
  }
  try {
    const remote = await plugin.checkUpdate({manifestUrl: MANIFEST_URL});
    const remoteCode = Number(remote?.versionCode || 0);
    if (remoteCode > local.versionCode && remote?.apkUrl) {
      return {
        status: 'update_available',
        local,
        remote: {
          versionCode: remoteCode,
          versionName: String(remote.versionName || `1.0.${remoteCode}`),
          apkUrl: String(remote.apkUrl),
          notes: remote.notes ? String(remote.notes) : undefined,
        },
      };
    }
    return {status: 'up_to_date', local};
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudo conectar para buscar actualizaciones.';
    return {status: 'error', local, message};
  }
}

export async function downloadAndInstallTvUpdate(
  apkUrl: string,
  onProgress: (pct: number) => void,
): Promise<{status: 'installed_intent' | 'needs_permission'}> {
  const plugin = getNativePlugin();
  if (!plugin) {
    throw new Error('Instalador disponible solo dentro de la app de Android TV.');
  }

  let handle: {remove: () => Promise<void>} | null = null;
  try {
    handle = await plugin.addListener('downloadProgress', (data) => {
      if (typeof data?.progress === 'number') {
        onProgress(Math.max(0, Math.min(100, Math.round(data.progress))));
      }
    });
  } catch {
    // fallback without progress events
  }

  try {
    return await plugin.downloadAndInstall({apkUrl});
  } finally {
    if (handle) {
      void handle.remove().catch(() => {});
    }
  }
}

export async function openTvInstallPermissionSettings(): Promise<void> {
  const plugin = getNativePlugin();
  if (!plugin) return;
  await plugin.openInstallPermission();
}

export async function installDownloadedTvUpdate(): Promise<
  'installed_intent' | 'needs_permission' | 'missing'
> {
  const plugin = getNativePlugin();
  if (!plugin) return 'missing';
  const res = await plugin.installCachedApk();
  return res.status;
}
