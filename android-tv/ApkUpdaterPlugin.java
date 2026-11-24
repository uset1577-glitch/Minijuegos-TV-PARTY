package com.mandoparty.tv;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private static final String UPDATE_FILE_NAME = "CgamesTVPARTY-update.apk";

    private File getCachedApkFile() {
        File dir = new File(getContext().getCacheDir(), "updates");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return new File(dir, UPDATE_FILE_NAME);
    }

    private boolean canInstallPackages() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return getContext().getPackageManager().canRequestPackageInstalls();
        }
        return true;
    }

    private HttpURLConnection openFollowingRedirects(String rawUrl) throws Exception {
        String currentUrl = rawUrl;
        for (int i = 0; i < 8; i++) {
            URL url = new URL(currentUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(30000);
            conn.setRequestProperty("User-Agent", "CgamesTVPARTY-Updater");
            int code = conn.getResponseCode();
            if (code == HttpURLConnection.HTTP_MOVED_PERM
                    || code == HttpURLConnection.HTTP_MOVED_TEMP
                    || code == HttpURLConnection.HTTP_SEE_OTHER
                    || code == 307
                    || code == 308) {
                String next = conn.getHeaderField("Location");
                conn.disconnect();
                if (next == null || next.isEmpty()) {
                    throw new Exception("Redireccion invalida al descargar.");
                }
                currentUrl = new URL(url, next).toString();
                continue;
            }
            return conn;
        }
        throw new Exception("Demasiadas redirecciones.");
    }

    private void launchApkInstaller(File apkFile) {
        Activity activity = getActivity();
        Uri apkUri = FileProvider.getUriForFile(
                activity,
                activity.getPackageName() + ".fileprovider",
                apkFile
        );
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        activity.startActivity(intent);
    }

    @PluginMethod
    public void getVersion(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            PackageInfo info = pm.getPackageInfo(getContext().getPackageName(), 0);
            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = info.getLongVersionCode();
            } else {
                versionCode = info.versionCode;
            }
            JSObject ret = new JSObject();
            ret.put("versionCode", (int) versionCode);
            ret.put("versionName", info.versionName != null ? info.versionName : "1.0.0");
            ret.put("canInstall", canInstallPackages());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("No se pudo leer la version instalada.", e);
        }
    }

    @PluginMethod
    public void checkUpdate(PluginCall call) {
        String manifestUrl = call.getString("manifestUrl");
        if (manifestUrl == null || manifestUrl.trim().isEmpty()) {
            call.reject("Falta la URL de actualizacion.");
            return;
        }

        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                conn = openFollowingRedirects(manifestUrl.trim());
                int code = conn.getResponseCode();
                if (code < 200 || code >= 300) {
                    call.reject("Servidor respondio codigo " + code);
                    return;
                }
                InputStream in = new BufferedInputStream(conn.getInputStream());
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buf = new byte[4096];
                int n;
                while ((n = in.read(buf)) != -1) {
                    out.write(buf, 0, n);
                }
                in.close();
                String jsonStr = new String(out.toByteArray(), StandardCharsets.UTF_8);
                JSObject parsed = new JSObject(jsonStr);
                call.resolve(parsed);
            } catch (Exception e) {
                call.reject("No se pudo consultar si hay actualizacion.", e);
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        }).start();
    }

    @PluginMethod
    public void openInstallPermission(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getContext().getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("No se pudo abrir los ajustes de instalacion.", e);
        }
    }

    @PluginMethod
    public void installCachedApk(PluginCall call) {
        File apkFile = getCachedApkFile();
        if (!apkFile.exists() || apkFile.length() == 0) {
            JSObject ret = new JSObject();
            ret.put("status", "missing");
            call.resolve(ret);
            return;
        }
        if (!canInstallPackages()) {
            JSObject ret = new JSObject();
            ret.put("status", "needs_permission");
            call.resolve(ret);
            return;
        }
        try {
            launchApkInstaller(apkFile);
            JSObject ret = new JSObject();
            ret.put("status", "installed_intent");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error al abrir el instalador de Android TV.", e);
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String apkUrl = call.getString("apkUrl");
        if (apkUrl == null || apkUrl.trim().isEmpty()) {
            call.reject("Falta la URL del APK.");
            return;
        }

        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                conn = openFollowingRedirects(apkUrl.trim());
                int code = conn.getResponseCode();
                if (code < 200 || code >= 300) {
                    call.reject("No se pudo descargar el APK (codigo " + code + ").");
                    return;
                }

                long totalLength = conn.getContentLengthLong();
                File apkFile = getCachedApkFile();
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                InputStream in = new BufferedInputStream(conn.getInputStream());
                FileOutputStream fos = new FileOutputStream(apkFile);
                byte[] buffer = new byte[16384];
                long downloaded = 0;
                int lastPct = -1;
                int read;
                while ((read = in.read(buffer)) != -1) {
                    fos.write(buffer, 0, read);
                    downloaded += read;
                    if (totalLength > 0) {
                        int pct = (int) Math.min(100, (downloaded * 100L) / totalLength);
                        if (pct != lastPct) {
                            lastPct = pct;
                            JSObject prog = new JSObject();
                            prog.put("progress", pct);
                            notifyListeners("downloadProgress", prog);
                        }
                    }
                }
                fos.flush();
                fos.close();
                in.close();

                JSObject doneProg = new JSObject();
                doneProg.put("progress", 100);
                notifyListeners("downloadProgress", doneProg);

                if (!canInstallPackages()) {
                    JSObject ret = new JSObject();
                    ret.put("status", "needs_permission");
                    call.resolve(ret);
                    return;
                }

                launchApkInstaller(apkFile);
                JSObject ret = new JSObject();
                ret.put("status", "installed_intent");
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Error descargando la actualizacion: " + e.getMessage(), e);
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        }).start();
    }
}
