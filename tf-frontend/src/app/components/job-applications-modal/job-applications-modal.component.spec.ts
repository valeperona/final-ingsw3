import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { JobApplicationsModalComponent } from './job-applications-modal.component';

describe('JobApplicationsModalComponent', () => {
  let component: JobApplicationsModalComponent;
  let fixture: ComponentFixture<JobApplicationsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobApplicationsModalComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobApplicationsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
