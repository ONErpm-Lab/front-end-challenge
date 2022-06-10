import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { TracksListComponent } from "./routes/tracks/tracks-list/tracks-list.component";

const routes: Routes = [
  { path: "**", redirectTo: "tracks-list", pathMatch: "full" },
  { path: "tracks-list", component: TracksListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
