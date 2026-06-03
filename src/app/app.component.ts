import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { AppController, bootstrapAppController } from './core/app-controller';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private controller?: AppController;

  ngAfterViewInit(): void {
    this.controller = bootstrapAppController();
  }

  ngOnDestroy(): void {
    this.controller = undefined;
  }
}
