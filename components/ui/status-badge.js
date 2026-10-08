const styles={Active:'badge-green',Paid:'badge-green',Present:'badge-green',Current:'badge-green',Pending:'badge-amber','Expiring soon':'badge-amber','Expiring Soon':'badge-amber','Partially Paid':'badge-amber','On leave':'badge-amber',Suspended:'badge-red',Overdue:'badge-red',Cancelled:'badge-red',Expired:'badge-red',Absent:'badge-red',Inactive:'badge-gray',Completed:'badge-blue'};
export default function StatusBadge({children}){return <span className={`status-badge ${styles[children]||'badge-gray'}`}><i/>{children}</span>}


