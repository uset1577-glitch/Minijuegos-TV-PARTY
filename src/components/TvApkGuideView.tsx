import {useEffect, useState} from 'react';
import {CheckCircle2, Cloud, Tv} from 'lucide-react';
import {soundFX} from '../utils/sound';

interface TvApkGuideViewProps {
  onBackHome: () => void;
}

export function TvApkGuideView({onBackHome}: TvApkGuideViewProps) {
  const [lastKey, setLastKey] = useState<string>('Pulsa cualquier tecla o flecha...');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      setLastKey(`${e.key} (${e.code})`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="max-w-5xl mx-auto w-full px-6 lg:px-10 py-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-sky-400">
            Google TV · Android TV · TV Box
          </p>
          <h1 className="text-3xl font-bold text-white">
            Generar APK en la nube
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Compila el APK gratis desde GitHub Actions sin instalar Android Studio ni gastar RAM en tu laptop.
          </p>
        </div>

        <button
          type="button"
          data-tv-focusable="true"
          data-tv-autofocus="true"
          onClick={() => {
            soundFX.confirm();
            onBackHome();
          }}
          className="tv-focusable px-5 py-2.5 rounded-xl bg-sky-400 text-slate-950 font-bold hover:bg-sky-300 whitespace-nowrap shrink-0"
        >
          Volver a juegos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl p-6 bg-[#161922] border border-white/8 space-y-2.5">
          <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold">
            <Cloud className="w-4 h-4" aria-hidden="true" />
            <span>1. Subir a GitHub</span>
          </div>
          <h2 className="text-lg font-bold text-white">Guarda el repositorio</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Descarga el proyecto y súbelo a un repositorio en GitHub. El archivo de compilación automática ya viene incluido.
          </p>
        </div>

        <div className="rounded-2xl p-6 bg-[#161922] border border-white/8 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>2. Ejecutar Actions</span>
          </div>
          <h2 className="text-lg font-bold text-white">Compila en la nube</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Abre la pestaña Actions y lanza el flujo. En unos minutos tendrás el archivo APK listo para descargar desde el navegador.
          </p>
        </div>

        <div className="rounded-2xl p-6 bg-[#161922] border border-white/8 space-y-2.5">
          <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
            <Tv className="w-4 h-4" aria-hidden="true" />
            <span>3. Instalar en TV</span>
          </div>
          <h2 className="text-lg font-bold text-white">Pásalo a tu TV Box</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Envía el APK por USB o con la app Downloader. Aparecerá en el menú principal de Google TV y Android TV.
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-[#161922] border border-white/8 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Probador de control (D-Pad)</h3>
          <p className="text-sm text-slate-400">
            Pulsa las flechas, Enter o Escape para comprobar la respuesta.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-[#0D0F14] border border-white/10 font-mono text-sm text-sky-300">
          {lastKey}
        </div>
      </div>
    </section>
  );
}
