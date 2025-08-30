import React from 'react'
import { cilCheckCircle, cilXCircle } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const ImportActionsTable = ({
  actions,
  openEdit,
  runNow,
  duplicateAction,
  deleteAction,
  onAddNew,
}) => (
  <div>
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Action Name</th>
          <th>Type</th>
          <th>Last Run</th>
          <th>Status</th>
          <th>Row Count / Limit</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {actions.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>
              No import actions found.
            </td>
          </tr>
        ) : (
          actions.map(action => (
            <tr key={action.id}>
              <td onClick={() => openEdit(action)} style={{ cursor: 'pointer' }}>{action.name}</td>
              <td>{action.type}</td>
              <td title={action.lastRunLog ?? ''}>{action.lastRunTime ?? ''} – {action.lastRunStatus ?? ''}</td>
              <td>
                {action.status === 'completed' || action.status === 'success' ? (
                  <CIcon icon={cilCheckCircle} size="lg" style={{ color: '#198754' }} title="Completed" />
                ) : action.status === 'failed' ? (
                  <CIcon icon={cilXCircle} size="lg" style={{ color: '#dc3545' }} title="Failed" />
                ) : action.status === 'pending' ? (
                  <span title="Pending">⏳</span>
                ) : action.status === 'warning' ? (
                  <span title="Warning">⚠</span>
                ) : (
                  <span style={{ color: '#888' }}>--</span>
                )}
              </td>
              <td>{action.rowCount ?? 0} / {action.rowLimit ?? 0}</td>
              <td>
                <button
                  onClick={() => openEdit(action)}
                  style={{ marginRight: 4, background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => runNow(action)} // Pass the whole action, not just action.id
                  style={{ marginRight: 4, background: '#198754', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Run
                </button>
                <button
                  onClick={() => duplicateAction(action)}
                  style={{ marginRight: 4, background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Duplicate
                </button>
                <button
                  onClick={() => deleteAction(action.id)}
                  style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

export default ImportActionsTable