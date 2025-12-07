import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LandingComponent } from './components/landing/landing.component';
import { RegisterComponent } from './components/register/register.component';
import { UserConfigComponent } from './pages/user-config/user-config.component';
import { MyUserComponent } from './pages/my-user/my-user.component';
import { VerifyAccountComponent } from './pages/verify-account/verify-account.component';
import { JobOpeningAdministratorComponent } from './pages/job-opening-administrator/job-opening-administrator.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { MyApplicationsComponent } from './pages/my-applications/my-applications.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Landing page como página de marketing
  { path: '', component: LandingComponent },
  
  // Nueva página de inicio con ofertas de trabajo
  { path: 'inicio', component: InicioComponent },
  
  // Rutas de autenticación existentes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-account', component: VerifyAccountComponent },
  
  // Rutas de usuario existentes
  { path: 'user-config', component: UserConfigComponent },
  { path: 'my-user', component: MyUserComponent },
  
  // Ruta de administración de ofertas existente
  { path: 'job-opening-administrator', component: JobOpeningAdministratorComponent },
  
  // Ruta de mis postulaciones
  { path: 'mis-postulaciones', component: MyApplicationsComponent },
  
  // Ruta de panel de administración - PROTEGIDA CON GUARD
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent,
    canActivate: [adminGuard]
  },
  
  // Wildcard route - redirigir a landing
  { path: '**', redirectTo: '' }
];