import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
  constructor(private location: Location) {}

  ngOnInit() {
    App.addListener('backButton', () => {
      if (window.history.length > 1) {
        this.location.back();
      } else {
        App.exitApp();
      }
    });
  }
}
