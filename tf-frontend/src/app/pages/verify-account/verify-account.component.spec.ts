import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';

import { VerifyAccountComponent } from './verify-account.component';

describe('VerifyAccountComponent', () => {
  let component: VerifyAccountComponent;
  let fixture: ComponentFixture<VerifyAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyAccountComponent, HttpClientTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
