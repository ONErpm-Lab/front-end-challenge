import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GridColumns } from 'src/app/models/grid-columns';
import { ApiSpotifyService } from 'src/app/services/api-spotify.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  cols: number | undefined;
  gridByBreakpoint: GridColumns = {
    xl: 5,
    lg: 4,
    md: 3,
    sm: 2,
    xs: 1,
  };

  items: any[] = [];
  listNames: string[] = [];

  listISRCs = [
    'US7VG1846811',
    'US7QQ1846811',
    'BRC310600002',
    'BR1SP1200071',
    'BR1SP1200070',
    'BR1SP1500002',
    'BXKZM1900338',
    'BXKZM1900345',
    'QZNJX2081700',
    'QZNJX2078148',
    'DED831600344', // adicionando mais algumas musicas
    'USMBR9900029',
    'USRE10102103',
    'USC4R1601987',
  ];

  constructor(
    private readonly apiSpotifyService: ApiSpotifyService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.listTracks();
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .subscribe((result) => {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.cols = this.gridByBreakpoint.xs;
        }
        if (result.breakpoints[Breakpoints.Small]) {
          this.cols = this.gridByBreakpoint.sm;
        }
        if (result.breakpoints[Breakpoints.Medium]) {
          this.cols = this.gridByBreakpoint.md;
        }
        if (result.breakpoints[Breakpoints.Large]) {
          this.cols = this.gridByBreakpoint.lg;
        }
        if (result.breakpoints[Breakpoints.XLarge]) {
          this.cols = this.gridByBreakpoint.xl;
        }
      });
  }

  openDetails(track: any) {
    this.router.navigate(['/details', track.id]);
  }

  listTracks() {
    this.listISRCs.forEach((isrc) => {
      this.apiSpotifyService.getISRC(isrc).subscribe((response: any) => {
        this.items.push(...response['tracks'].items);
        this.orderAlphabetical();
      });
    });
  }

  orderAlphabetical() {
    this.items.sort((a: any, b: any) => {
      return a.name >= b.name ? 1 : -1;
    });
  }
}
