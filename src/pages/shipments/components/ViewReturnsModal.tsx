import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { ShipmentData, ReturnShipmentData } from '../../../models/api-models/ShipmentModels';
import { shipmentApi } from '../../../api/shipmentApi';
import { format } from 'date-fns';

interface ViewReturnsModalProps {
  open: boolean;
  onClose: () => void;
  shipment: ShipmentData | null;
  onReturnCancelled?: () => void;
}

/**
 * Get status color for return shipment status
 */
const getStatusColor = (status?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status?.toUpperCase()) {
    case 'RETURN_PENDING':
      return 'warning';
    case 'RETURN_PICKUP_SCHEDULED':
    case 'RETURN_PICKED_UP':
    case 'RETURN_IN_TRANSIT':
      return 'info';
    case 'RETURN_OUT_FOR_DELIVERY':
      return 'primary';
    case 'RETURN_DELIVERED':
      return 'success';
    case 'RETURN_CANCELLED':
      return 'error';
    case 'RETURN_FAILED':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Format return reason for display
 */
const formatReturnReason = (reason?: string): string => {
  if (!reason) return 'N/A';
  return reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

/**
 * Modal to view and manage return shipments for a shipment
 */
const ViewReturnsModal: React.FC<ViewReturnsModalProps> = ({
  open,
  onClose,
  shipment,
  onReturnCancelled,
}) => {
  const [expandedReturn, setExpandedReturn] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCancelReturn = async (returnShipment: ReturnShipmentData) => {
    if (!returnShipment.returnShipmentId) return;

    setCancellingId(returnShipment.returnShipmentId);
    setError(null);

    try {
      await shipmentApi.cancelReturn(returnShipment.returnShipmentId);
      onReturnCancelled?.();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel return shipment';
      setError(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const toggleExpand = (id: number | undefined) => {
    if (!id) return;
    setExpandedReturn(expandedReturn === id ? null : id);
  };

  if (!shipment) return null;

  const returnShipments = shipment.returnShipments ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Return Shipments for Shipment #{shipment.shipmentId}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {returnShipments.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No return shipments found for this shipment.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell width={50}></TableCell>
                  <TableCell>Return ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>ShipRocket Order ID</TableCell>
                  <TableCell>AWB Code</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returnShipments.map((rs) => (
                  <React.Fragment key={rs.returnShipmentId}>
                    <TableRow
                      hover
                      sx={{ '& > *': { borderBottom: 'unset' } }}
                    >
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpand(rs.returnShipmentId)}
                        >
                          {expandedReturn === rs.returnShipmentId ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          #{rs.returnShipmentId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rs.returnType?.replace('_', ' ') ?? 'N/A'}
                          size="small"
                          color={rs.returnType === 'FULL_RETURN' ? 'primary' : 'secondary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rs.shipRocketReturnStatus ?? 'N/A'}
                          size="small"
                          color={getStatusColor(rs.shipRocketReturnStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {rs.shipRocketReturnOrderId ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {rs.shipRocketReturnAwbCode ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {rs.createdAt ? format(new Date(rs.createdAt), 'MMM dd, yyyy HH:mm') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {rs.shipRocketReturnStatus?.toUpperCase() !== 'RETURN_CANCELLED' &&
                         rs.shipRocketReturnStatus?.toUpperCase() !== 'RETURN_DELIVERED' && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            disabled={cancellingId === rs.returnShipmentId}
                            onClick={() => handleCancelReturn(rs)}
                            startIcon={cancellingId === rs.returnShipmentId ? <CircularProgress size={16} /> : null}
                          >
                            {cancellingId === rs.returnShipmentId ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        )}
                        {rs.shipRocketReturnStatus?.toUpperCase() === 'RETURN_CANCELLED' && (
                          <Typography variant="body2" color="error">
                            Cancelled
                          </Typography>
                        )}
                        {rs.shipRocketReturnStatus?.toUpperCase() === 'RETURN_DELIVERED' && (
                          <Typography variant="body2" color="success.main">
                            Completed
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expandable Row for Products */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={expandedReturn === rs.returnShipmentId} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Returned Products
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Product</TableCell>
                                  <TableCell>SKU</TableCell>
                                  <TableCell align="center">Quantity</TableCell>
                                  <TableCell>Reason</TableCell>
                                  <TableCell>Comments</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {rs.products?.map((product, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{product.productName ?? `Product #${product.productId}`}</TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontFamily="monospace">
                                        {product.productSku ?? '—'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">{product.returnQuantity ?? 0}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={formatReturnReason(product.returnReason)}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">
                                        {product.returnComments ?? '—'}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {(!rs.products || rs.products.length === 0) && (
                                  <TableRow>
                                    <TableCell colSpan={5} align="center">
                                      <Typography variant="body2" color="text.secondary">
                                        No products found
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>

                            {/* Dimensions */}
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Weight:</strong> {rs.returnWeightKgs ?? 0} kg
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Dimensions:</strong> {rs.returnLength ?? 0} x {rs.returnBreadth ?? 0} x {rs.returnHeight ?? 0} cm
                              </Typography>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewReturnsModal;
