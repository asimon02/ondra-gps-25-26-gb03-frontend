import { Component } from '@angular/core';

@Component({
  selector: 'app-cookies-policy',
  standalone: true,
  imports: [],
  templateUrl: './cookies-policy.component.html',
  styleUrl: './cookies-policy.component.scss'
})
export class CookiesPolicyComponent {
  volverAtras() {
    window.history.back();
  }
}
