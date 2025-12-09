# Pipeline CI/CD - Documentación Completa

## Descripción General

Este proyecto utiliza **GitHub Actions** para implementar un pipeline CI/CD completo que incluye:
- Tests unitarios (Backend y Frontend)
- Análisis de calidad de código (SonarCloud)
- Builds de imágenes Docker
- Deploys automáticos a QA
- Tests de integración (Smoke Tests y Cypress)
- Deploy manual a Producción

---

## Ubicación de Archivos del Pipeline

### **Archivo Principal del Pipeline**
```
📁 .github/workflows/deploy.yml
```
Este es el archivo que define todo el flujo de CI/CD.

### **Configuración de SonarCloud**
```
📁 sonar-project.properties
```
Configuración del análisis de calidad de código (aunque muchos parámetros se pasan via CLI).

### **Tests Unitarios**

#### Backend (Python/Pytest)
```
📁 APIs/UserAPI/tests/
├── test_complete.py          # Tests completos del backend
├── conftest.py               # Fixtures de pytest
└── __init__.py
```

**Comando de ejecución:**
```bash
cd APIs/UserAPI
DATABASE_URL="sqlite:///test.db" python -m pytest tests/test_complete.py -v --cov=. --cov-report=xml
```

**Artefactos generados:**
- `APIs/UserAPI/coverage.xml` - Reporte de coverage en formato XML

#### Frontend (Angular/Karma/Jasmine)
```
📁 tf-frontend/src/
├── app/services/*.spec.ts    # Tests de servicios
├── app/components/**/*.spec.ts  # Tests de componentes
├── app/guards/*.spec.ts      # Tests de guards
└── app/pages/**/*.spec.ts    # Tests de páginas
```

**Configuración:**
- `tf-frontend/karma.conf.js` - Configuración de Karma
- `tf-frontend/angular.json` - Configuración de Angular tests

**Comando de ejecución:**
```bash
cd tf-frontend
npx ng test --no-watch --code-coverage --browsers=ChromeHeadlessNoSandbox
```

**Artefactos generados:**
- `tf-frontend/coverage/tf-frontend/lcov.info` - Reporte de coverage

---

### **Tests de Integración (Cypress)**

```
📁 tf-frontend/cypress/
├── e2e/
│   ├── 01-landing.cy.ts      # Tests de página landing
│   ├── 02-register-candidato.cy.ts  # Tests de registro candidato
│   └── 03-register-empresa.cy.ts    # Tests de registro empresa
├── fixtures/                  # Datos de prueba
├── support/
│   ├── commands.ts           # Comandos personalizados
│   └── e2e.ts                # Setup global
└── screenshots/              # Screenshots en caso de fallo (generado)
```

**Configuración:**
- `tf-frontend/cypress.config.ts` - Configuración de Cypress

**Comando de ejecución:**
```bash
cd tf-frontend
cypress run --headless --browser chrome --config baseUrl=https://frontend-qa-737714447258.us-central1.run.app
```

**Artefactos generados:**
- `tf-frontend/cypress/videos/` - Videos de las ejecuciones
- `tf-frontend/cypress/screenshots/` - Screenshots de fallos (si los hay)

---

### **Análisis de Calidad (SonarCloud)**

**Archivos analizados:**
- Backend: `APIs/UserAPI/routes.py`, `APIs/UserAPI/services.py`
- Frontend: `tf-frontend/src/app/**/*.ts`

**Coverage reports consumidos:**
- `APIs/UserAPI/coverage.xml`
- `tf-frontend/coverage/lcov.info`

**Dashboard:**
https://sonarcloud.io/project/overview?id=francotalloneucc_final-ingsw3

---

### **Dockerfiles**

#### Backend
```
📁 APIs/UserAPI/Dockerfile
```

**Características:**
- Base: `python:3.12-slim`
- Usuario no-root: `appuser` (UID 1000)
- Puerto: 8080
- Copia selectiva de archivos (seguridad)

#### Frontend

**QA:**
```
📁 tf-frontend/Dockerfile
```
Build argument: `BUILD_ENV=qa`

**Producción:**
Mismo Dockerfile con `BUILD_ENV=production`

---

## Estructura del Pipeline

El pipeline se divide en **8 fases secuenciales**:

---

## FASE 1: Tests en Paralelo

### ⏱️ Duración: ~2-3 minutos

Ejecuta tests de backend y frontend en paralelo para optimizar tiempo.

### **Job: `test-backend`**

**Pasos:**
1. Checkout del código
2. Setup Python 3.12
3. Instalar dependencias (`pip install -r requirements.txt`)
4. Ejecutar tests con coverage
5. Upload coverage a Codecov (opcional)
6. Upload coverage como artefacto

**Artefactos generados:**
- `backend-coverage` (contiene `coverage.xml`)

**Archivo de configuración:**
```
📁 APIs/UserAPI/requirements.txt
```

---

### **Job: `test-frontend`**

**Pasos:**
1. Checkout del código
2. Setup Node.js 20
3. Cache de npm
4. Instalar dependencias (`npm ci`)
5. Ejecutar tests con coverage
6. Verificar generación de `lcov.info`
7. Upload coverage a Codecov (opcional)
8. Upload coverage como artefacto

**Artefactos generados:**
- `frontend-coverage` (contiene `lcov.info`)

**Archivos de configuración:**
```
📁 tf-frontend/package.json
📁 tf-frontend/karma.conf.js
📁 tf-frontend/angular.json
```

---

## FASE 2: SonarCloud Analysis

### ⏱️ Duración: ~1-2 minutos

Analiza la calidad del código usando los reportes de coverage generados en Fase 1.

### **Job: `sonarcloud`**

**Dependencias:** `test-backend`, `test-frontend`

**Pasos:**
1. Checkout del código (con `fetch-depth: 0` para análisis completo)
2. Download artefacto `backend-coverage`
3. Download artefacto `frontend-coverage`
4. Normalizar paths de coverage
5. Verificar que existan los archivos
6. Ejecutar SonarCloud Scan

**Action utilizada:**
```yaml
sonarsource/sonarcloud-github-action@v2
```

**Variables de entorno necesarias:**
- `SONAR_TOKEN` (GitHub Secret)

**Métricas analizadas:**
- Coverage de código
- Code Smells
- Bugs
- Vulnerabilidades
- Security Hotspots
- Duplicaciones
- Complejidad ciclomática

**Configuración:**
```
📁 sonar-project.properties (parcial)
📁 .github/workflows/deploy.yml (líneas 199-219)
```

---

## FASE 3: Builds en Paralelo

### ⏱️ Duración: ~3-5 minutos

Construye imágenes Docker para backend y frontend.

### **Job: `build-userapi`**

**Dependencias:** `sonarcloud`

**Pasos:**
1. Checkout del código
2. Autenticación con GCP
3. Setup gcloud CLI
4. Configurar Docker auth para Artifact Registry
5. Build imagen Docker del backend
6. Tag: `us-central1-docker.pkg.dev/final-ingsoft3-2025-480515/cloud-run-source-deploy/userapi:${GITHUB_SHA}`
7. Push a Artifact Registry

**Output:**
- `image`: URL de la imagen construida

**Ubicación del Dockerfile:**
```
📁 APIs/UserAPI/Dockerfile
```

---

### **Job: `build-frontend-qa`**

**Dependencias:** `sonarcloud`

**Pasos:**
1. Checkout del código
2. Autenticación con GCP
3. Setup gcloud CLI
4. Configurar Docker auth
5. Build imagen Docker del frontend (QA)
6. Build argument: `BUILD_ENV=qa`
7. Tag: `us-central1-docker.pkg.dev/final-ingsoft3-2025-480515/cloud-run-source-deploy/frontend-qa:${GITHUB_SHA}`
8. Push a Artifact Registry

**Output:**
- `image`: URL de la imagen construida

**Ubicación del Dockerfile:**
```
📁 tf-frontend/Dockerfile
```

---

## FASE 4: Deploy a QA

### ⏱️ Duración: ~1-2 minutos

Despliega automáticamente a ambiente de QA (sin aprobación manual).

### **Job: `deploy-qa`** (Backend)

**Dependencias:** `build-userapi`

**Environment:** `qa`

**Pasos:**
1. Autenticación con GCP
2. Clear configuración anterior
3. Deploy a Cloud Run

**Servicio:**
- Nombre: `userapi-qa`
- Región: `us-central1`
- URL: https://userapi-qa-737714447258.us-central1.run.app

**Configuración:**
- Secrets desde Secret Manager:
  - `DATABASE_URL`
  - `SECRET_KEY`
  - `EMAIL_USER`
  - `EMAIL_PASSWORD`
  - `INTERNAL_SERVICE_API_KEY`
- Cloud SQL instance: `userapi-db`
- Service Account: `userapi-service-account`

---

### **Job: `deploy-frontend-qa`** (Frontend)

**Dependencias:** `build-frontend-qa`

**Environment:** `qa`

**Pasos:**
1. Autenticación con GCP
2. Deploy a Cloud Run

**Servicio:**
- Nombre: `frontend-qa`
- Región: `us-central1`
- URL: https://frontend-qa-737714447258.us-central1.run.app
- Puerto: 8080

---

## FASE 5: Smoke Tests

### ⏱️ Duración: ~30 segundos

Verifica que los servicios desplegados en QA estén funcionando.

### **Job: `smoke-tests`**

**Dependencias:** `deploy-qa`, `deploy-frontend-qa`

**Pasos:**

1. **Wait for services** (10 segundos)

2. **Test Backend Health**
   ```bash
   curl https://userapi-qa-737714447258.us-central1.run.app/
   ```
   Verifica código HTTP 200 o 404

3. **Test Backend API Endpoint**
   ```bash
   curl https://userapi-qa-737714447258.us-central1.run.app/api/v1/health
   ```
   Verifica que responda (cualquier respuesta es válida)

4. **Test Frontend Health**
   ```bash
   curl https://frontend-qa-737714447258.us-central1.run.app/
   ```
   Verifica código HTTP 200

5. **Test Frontend Loads**
   Verifica que el HTML contenga `app-root`

---

## FASE 6: Cypress Integration Tests

### ⏱️ Duración: ~2-4 minutos

Ejecuta tests end-to-end contra el ambiente de QA.

### **Job: `cypress-tests`**

**Dependencias:** `smoke-tests`

**Pasos:**
1. Checkout del código
2. Setup Node.js 20
3. Cache npm dependencies
4. Install dependencies
5. Run Cypress tests

**Action utilizada:**
```yaml
cypress-io/github-action@v6
```

**Configuración:**
- Working directory: `tf-frontend`
- Browser: Chrome
- Base URL: `https://frontend-qa-737714447258.us-central1.run.app`

**Tests ejecutados:**
```
📁 tf-frontend/cypress/e2e/
├── 01-landing.cy.ts
├── 02-register-candidato.cy.ts
└── 03-register-empresa.cy.ts
```

**Artefactos generados (on failure):**
- Screenshots: `tf-frontend/cypress/screenshots/`
- Videos: `tf-frontend/cypress/videos/`

**Comportamiento:**
- `continue-on-error: false` - Si falla, bloquea el pipeline

---

## FASE 7: Deploy a Producción (Backend)

### ⏱️ Duración: ~1-2 minutos

Despliega el backend a producción **con aprobación manual**.

### **Job: `deploy-production`**

**Dependencias:** `cypress-tests`, `build-userapi`

**Environment:** `production` ⚠️ **Requiere aprobación manual**

**Pasos:**
1. Autenticación con GCP
2. Clear configuración anterior
3. Deploy a Cloud Run

**Servicio:**
- Nombre: `userapi`
- Región: `us-central1`
- URL: https://userapi-737714447258.us-central1.run.app

**Diferencias con QA:**
- `ACCESS_TOKEN_EXPIRE_MINUTES=120` (en QA es 30)
- Mismos secrets y Cloud SQL instance

---

### **Job: `build-frontend-prod`** (en paralelo)

**Dependencias:** `cypress-tests`

**Pasos:**
1. Checkout del código
2. Autenticación con GCP
3. Setup gcloud CLI
4. Build imagen Docker del frontend (Producción)
5. Build argument: `BUILD_ENV=production`
6. Tag: `us-central1-docker.pkg.dev/final-ingsoft3-2025-480515/cloud-run-source-deploy/frontend-prod:${GITHUB_SHA}`
7. Push a Artifact Registry

**Output:**
- `image`: URL de la imagen construida

---

## FASE 8: Deploy Frontend a Producción

### ⏱️ Duración: ~1-2 minuto

Despliega el frontend a producción **con aprobación manual**.

### **Job: `deploy-frontend-prod`**

**Dependencias:** `build-frontend-prod`

**Environment:** `production` ⚠️ **Requiere aprobación manual**

**Pasos:**
1. Autenticación con GCP
2. Deploy a Cloud Run

**Servicio:**
- Nombre: `frontend`
- Región: `us-central1`
- URL: https://frontend-737714447258.us-central1.run.app
- Puerto: 8080

---

## Configuración de GitHub Secrets

El pipeline requiere los siguientes secrets configurados en GitHub:

### **Secrets necesarios:**

| Secret | Descripción | Usado en |
|--------|-------------|----------|
| `GCP_SA_KEY` | Service Account Key de GCP (JSON) | Todos los jobs de deploy/build |
| `SONAR_TOKEN` | Token de autenticación de SonarCloud | Job `sonarcloud` |
| `CODECOV_TOKEN` | Token de Codecov (opcional) | Jobs de tests |
| `CYPRESS_RECORD_KEY` | Key para grabar tests en Cypress Dashboard (opcional) | Job `cypress-tests` |

### **GCP Secret Manager:**

Los siguientes secrets están almacenados en GCP Secret Manager y son inyectados en Cloud Run:

- `DATABASE_URL` - Conexión a PostgreSQL
- `SECRET_KEY` - Clave para JWT
- `EMAIL_USER` - Usuario SMTP
- `EMAIL_PASSWORD` - Password SMTP
- `INTERNAL_SERVICE_API_KEY` - API key para comunicación entre servicios

---

## Configuración de Environments en GitHub

### **Environment: `qa`**
- Sin protección
- Deploy automático
- URL: https://frontend-qa-737714447258.us-central1.run.app

### **Environment: `production`**
- ⚠️ **Required reviewers configurado**
- Deploy manual (requiere aprobación)
- URL: https://frontend-737714447258.us-central1.run.app

**Para aprobar un deploy a producción:**
1. Ve a: https://github.com/francotalloneucc/final-ingsw3/actions
2. Selecciona el workflow run
3. Click en "Review deployments"
4. Marca "production"
5. Click "Approve and deploy"

---

## Trigger del Pipeline

El pipeline se ejecuta automáticamente en:

```yaml
on:
  push:
    branches: [main]
```

**Esto significa:**
- Cada push a la rama `main` dispara el pipeline completo
- Pull requests **NO** disparan el pipeline (solo push a main)

---

## Duración Total del Pipeline

### **Sin aprobación manual:**
- Fase 1 (Tests): ~2-3 min
- Fase 2 (SonarCloud): ~1-2 min
- Fase 3 (Builds): ~3-5 min
- Fase 4 (Deploy QA): ~1-2 min
- Fase 5 (Smoke Tests): ~0.5 min
- Fase 6 (Cypress): ~2-4 min
- **Total hasta QA: ~10-17 minutos**

### **Con aprobación y deploy a producción:**
- Fase 7-8 (Prod Deploy): ~2-3 min
- **Total completo: ~12-20 minutos**

---

## Diagrama de Flujo

```
┌─────────────────────────────────────┐
│  PUSH TO MAIN                       │
└─────────────────┬───────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼─────┐              ┌──────▼────┐
│ Test    │              │ Test      │
│ Backend │              │ Frontend  │
│ (Pytest)│              │ (Karma)   │
└───┬─────┘              └──────┬────┘
    │                           │
    └─────────────┬─────────────┘
                  │
         ┌────────▼────────┐
         │  SonarCloud     │
         │  Analysis       │
         └────────┬────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼─────┐              ┌──────▼────────┐
│ Build   │              │ Build         │
│ Backend │              │ Frontend (QA) │
└───┬─────┘              └──────┬────────┘
    │                           │
    └─────────────┬─────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────┐         ┌────────▼─────┐
│ Deploy     │         │ Deploy       │
│ Backend QA │         │ Frontend QA  │
└───┬────────┘         └────────┬─────┘
    │                           │
    └─────────────┬─────────────┘
                  │
         ┌────────▼────────┐
         │  Smoke Tests    │
         │  (Health checks)│
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  Cypress E2E    │
         │  Tests          │
         └────────┬────────┘
                  │
    ┌─────────────┴─────────────────┐
    │                               │
┌───▼────────────┐      ┌───────────▼──────┐
│ Deploy Backend │      │ Build Frontend   │
│ to PRODUCTION  │      │ PRODUCTION       │
│ ⚠️  MANUAL     │      └───────────┬──────┘
└───┬────────────┘                  │
    │                       ┌────────▼─────────┐
    │                       │ Deploy Frontend  │
    │                       │ to PRODUCTION    │
    │                       │ ⚠️  MANUAL       │
    └───────────────────────┴──────────────────┘
```

---

## Troubleshooting

### **Pipeline falla en tests:**
- Revisar logs de pytest o karma
- Los tests pueden fallar por:
  - Cambios en el código sin actualizar tests
  - Problemas con fixtures o mocks
  - Tests que dependen de estado anterior

**Ubicación de logs:**
```
GitHub Actions → Workflow run → Job correspondiente → Step "Run tests"
```

---

### **Pipeline falla en Cypress:**
- Revisar videos y screenshots
- Descargar artefactos del workflow run
- Verificar que QA esté funcionando

**Artefactos:**
- `cypress-screenshots` (solo si hay fallos)
- `cypress-videos`

---

### **SonarCloud no encuentra coverage:**
- Verificar que se generaron los artefactos
- Revisar step "Verify coverage reports"
- Problema conocido: coverage puede ser bajo si paths no coinciden

---

### **Deploy a Cloud Run falla:**
- Verificar que los secrets existan en Secret Manager
- Verificar permisos del Service Account
- Revisar logs de Cloud Run en GCP Console

---

## Mejoras Futuras

1. **Tests de regresión visual** con Percy o Chromatic
2. **Performance testing** con Lighthouse CI
3. **Dependency scanning** con Dependabot
4. **SAST (Static Application Security Testing)** adicional
5. **Deploy a staging** entre QA y Producción
6. **Rollback automático** si los health checks fallan post-deploy
7. **Notificaciones** a Slack/Discord cuando falla el pipeline

---

## Referencias

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **SonarCloud**: https://sonarcloud.io/
- **Cypress**: https://www.cypress.io/
- **Cloud Run**: https://cloud.google.com/run/docs
- **Pytest**: https://docs.pytest.org/
- **Karma**: https://karma-runner.github.io/

---

## Contacto

Para preguntas sobre el pipeline:
- Repositorio: https://github.com/francotalloneucc/final-ingsw3
- Pipeline: https://github.com/francotalloneucc/final-ingsw3/actions

---

**Última actualización:** Diciembre 2025
