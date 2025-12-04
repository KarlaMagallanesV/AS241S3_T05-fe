import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';

import { Client } from 'app/feature/client/interfaces/client';
import { ClientService } from '../../../client/services/client.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home-list',
  standalone: true,
  imports: [],
  templateUrl: './home-list.html',
  styleUrls: ['./home-list.scss']
})
export class HomeList implements OnInit {
  @Output() newClientsCount = new EventEmitter<number>();

  clients: Client[] = [];
  paginatedClients: Client[] = [];
  filteredClients: Client[] = [];
  private clientService = inject(ClientService);
  currentPage = 1;
  itemsPerPage = 7;

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.clientService.findAll().subscribe({
      next: (response: Client[]) => {
        this.clients = response;

        // Emitir cantidad de nuevos
        const newClients = this.clients.filter(c => c.visitFrequency === 'N');
        this.newClientsCount.emit(newClients.length);

        this.filteredClients = this.clients.filter(
          (client) => client.visitFrequency === 'N'
        );
        this.updatePaginatedClients();
      },
      error: (err: any) => {
        console.error('Error al cargar servicios:', err);
        Swal.fire('Error', 'No se pudieron cargar los servicios', 'error');
      }
    });
  }


  updatePaginatedClients(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedClients = this.filteredClients.slice(start, start + this.itemsPerPage);
  }
}
