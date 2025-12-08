import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { JobOpeningAdministratorComponent } from './job-opening-administrator.component';

describe('JobOpeningAdministratorComponent', () => {
  let component: JobOpeningAdministratorComponent;
  let fixture: ComponentFixture<JobOpeningAdministratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobOpeningAdministratorComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobOpeningAdministratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
