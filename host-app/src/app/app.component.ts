import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Importar auth para que esté disponible vía Federation
import './core/auth';

@Component({
  selector: 'host-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'host-app';
}
