import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JoinRoomComponent } from './components/join-room/join-room.component';
import { EditorComponent } from './pages/editor/editor.component';

const routes: Routes = [
  { path: '', component: JoinRoomComponent },
  { path: 'editor/:roomId/:username', component: EditorComponent },
  { path: '**', redirectTo: '' }, // Redirect to join room for any unknown routes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
