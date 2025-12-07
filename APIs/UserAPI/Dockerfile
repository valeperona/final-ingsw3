# Dockerfile para UserAPI - FastAPI
FROM python:3.12-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Crear directorios necesarios
RUN mkdir -p uploaded_cvs profile_pictures temp_files temp_registrations

# Exponer puerto
EXPOSE 8080

# Variable de entorno para Cloud Run
ENV PORT=8080

# Comando para ejecutar la aplicación
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
