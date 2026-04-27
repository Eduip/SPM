# Deploy en Vercel

## 1. Subir el proyecto a GitHub

Desde la carpeta del proyecto:

```bash
cd /Users/edu/Desktop/sistema-proyectos-municipales
git init
git add .
git commit -m "Version lista para piloto con cliente"
```

Luego crea un repositorio en GitHub y conecta el remoto:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

## 2. Crear proyecto en Vercel

1. Entra a https://vercel.com
2. Inicia sesion
3. Elige **Add New Project**
4. Importa el repositorio de GitHub
5. Framework: **Next.js**

Vercel deberia detectar automaticamente:

- Build Command: `npm run build`
- Install Command: `npm install`
- Output: automatico para Next.js

## 3. Variables de entorno en Vercel

En el proyecto de Vercel, agrega estas variables copiando los valores reales desde tu `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Opcionales para la capa IA:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_IMAGE_MODEL`

Referencia local: `.env.example`

## 4. Hacer el primer deploy

Despues de guardar las variables, ejecuta el deploy desde la interfaz de Vercel.

Cuando termine, tendras una URL publica como:

`https://tu-proyecto.vercel.app`

## 5. Revisiones recomendadas despues del deploy

1. Probar login
2. Probar creacion de proyecto
3. Probar cartera de proyectos
4. Probar dashboard
5. Probar IA de consulta
6. Probar IA de formulacion
7. Probar generacion de imagenes

## 6. Observacion importante

Si Supabase esta en plan gratuito, puede pausarse por inactividad. Para un piloto corto suele servir, pero para una prueba mas sostenida conviene monitorearlo.

## 7. Limitacion actual antes de publicar

Hoy el sistema guarda parte de la configuracion y archivos generados en la carpeta local `data/`.

Ejemplos:

- parametros IA
- documentos estrategicos cargados para IA
- configuracion IA por campo
- visualizaciones generadas por IA

En Vercel, las funciones tienen filesystem de solo lectura y solo disponen de espacio temporal en `/tmp`, por lo que esa informacion **no persistira de forma confiable** entre ejecuciones.

Referencia oficial:

- https://vercel.com/docs/functions/runtimes

Antes de publicar para que varios equipos lo prueben, conviene migrar esa persistencia a Supabase Storage y/o tablas en Supabase.
