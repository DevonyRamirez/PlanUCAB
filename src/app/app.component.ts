import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'planUCAB-fronted';
  showHeader = false;
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateHeaderVisibility();
    });
    this.updateHeaderVisibility();
  }

  ngOnInit(): void {
    this.updateBodyScroll();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    document.body.style.overflow = '';
  }

  private updateHeaderVisibility(): void {
    const currentUrl = this.router.url;
    this.showHeader = currentUrl !== '/login' && this.authService.isAuthenticated();
    this.updateBodyScroll();
  }

  private updateBodyScroll(): void {
    const currentUrl = this.router.url;
    if (currentUrl === '/login') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}
