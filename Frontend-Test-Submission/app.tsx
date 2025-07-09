import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";

const API_BASE = "http://localhost:3000"; // Change if backend runs elsewhere

export default function App() {
  // State for creating short URL
  const [url, setUrl] = useState("");
  const [validity, setValidity] = useState("");
  const [shortcode, setShortcode] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<null | {
    shortcode: string;
    url: string;
    createdAt: string;
    expiresAt: string;
  }>(null);

  // State for stats
  const [statsCode, setStatsCode] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<null | any>(null);

  // Error and notification
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create short URL handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setCreated(null);
    try {
      const res = await fetch(`${API_BASE}/shorturls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          validity: validity ? Number(validity) : undefined,
          shortcode: shortcode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create short URL");
      setCreated(data);
      setSuccess("Short URL created!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Fetch stats handler
  const handleStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatsLoading(true);
    setError("");
    setStats(null);
    try {
      const res = await fetch(`${API_BASE}/shorturls/${statsCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch stats");
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        URL Shortener Service
      </Typography>

      {/* Create Short URL */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Create a Short URL
        </Typography>
        <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Original URL"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Custom Shortcode (optional)"
            value={shortcode}
            onChange={e => setShortcode(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 32 }}
          />
          <TextField
            label="Validity (minutes, optional, default 30)"
            type="number"
            value={validity}
            onChange={e => setValidity(e.target.value)}
            fullWidth
            inputProps={{ min: 1 }}
          />
          <Button type="submit" variant="contained" disabled={creating}>
            {creating ? <CircularProgress size={24} /> : "Create"}
          </Button>
        </Box>
        {created && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="success">
              Short URL:{" "}
              <a
                href={`${API_BASE}/${created.shortcode}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {API_BASE}/{created.shortcode}
              </a>
              <br />
              Expires at: {new Date(created.expiresAt).toLocaleString()}
            </Alert>
          </Box>
        )}
      </Paper>

      <Divider sx={{ mb: 4 }} />

      {/* Retrieve Stats */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Retrieve Short URL Statistics
        </Typography>
        <Box component="form" onSubmit={handleStats} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            label="Shortcode"
            value={statsCode}
            onChange={e => setStatsCode(e.target.value)}
            required
            sx={{ flex: 1 }}
          />
          <Button type="submit" variant="outlined" disabled={statsLoading}>
            {statsLoading ? <CircularProgress size={24} /> : "Get Stats"}
          </Button>
        </Box>
        {stats && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1">
              Original URL: <a href={stats.originalUrl} target="_blank" rel="noopener noreferrer">{stats.originalUrl}</a>
            </Typography>
            <Typography>
              Created: {new Date(stats.createdAt).toLocaleString()} <br />
              Expires: {new Date(stats.expiresAt).toLocaleString()} <br />
              Total Clicks: {stats.totalClicks}
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Referrer</TableCell>
                    <TableCell>Geo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.clicks.map((click: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(click.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{click.referrer || "-"}</TableCell>
                      <TableCell>{click.geo || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
        <Alert severity="error" onClose={() => setError("")}>{error}</Alert>
      </Snackbar>
      {/* Success Snackbar */}
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
        <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>
      </Snackbar>
    </Container>
  );
}