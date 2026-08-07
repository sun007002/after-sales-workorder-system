/**
 * Work order form page (create/edit).
 * Wraps the WorkOrderForm component in a card layout.
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import WorkOrderForm from '../components/workOrder/WorkOrderForm';

/**
 * Work order form page for creating or editing work orders.
 */
const WorkOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const workOrderId = id ? parseInt(id, 10) : undefined;

  return (
    <div>
      <PageHeader
        title={workOrderId ? '编辑工单' : '新建工单'}
        actions={null}
      />
      <Card>
        <CardContent>
          <WorkOrderForm
            workOrderId={workOrderId}
            onSuccess={() => navigate('/work-orders')}
            onCancel={() => navigate(-1)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrderFormPage;
