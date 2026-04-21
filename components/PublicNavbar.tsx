"use client";

import { Box, Typography } from "@mui/material";
import Link from "next/link";

export default function PublicNavbar({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f9fafb' }}>
      <Box sx={{ 
        width: '100%', 
        bgcolor: '#c00000', 
        height: 6
      }} />
      <Box sx={{ 
        bgcolor: 'white', 
        py: 2, 
        px: 3, 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
        display: 'flex', 
        justifyContent: 'center',
        borderBottom: '1px solid #eaeaea'
      }}>
        <Link href="/noticias" style={{ textDecoration: 'none' }}>
          <Typography variant="h4" component="h1" fontWeight="900" sx={{ color: '#c00000', letterSpacing: '-1.5px', fontFamily: '"Georgia", serif' }}>
            Portal Inteligente
          </Typography>
        </Link>
      </Box>
      <Box sx={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#f9fafb' }}>
        {children}
      </Box>
    </Box>
  );
}
