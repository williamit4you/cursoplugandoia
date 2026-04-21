"use client";

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip } from "@mui/material";
import Link from "next/link";

export default function PostsTable({ initialData }: { initialData: any[] }) {
  return (
    <>
      <Button component={Link} href="/admin/posts/new" variant="contained" color="primary" sx={{ mb: 2 }}>Nova Notícia</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Visualizações</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">Nenhuma notícia encontrada.</TableCell>
              </TableRow>
            )}
            {initialData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>
                  <Chip label={item.status} color={item.status === 'PUBLISHED' ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell>{item.views}</TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button component={Link} href={`/admin/posts/${item.id}`} size="small" variant="outlined">Editar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
