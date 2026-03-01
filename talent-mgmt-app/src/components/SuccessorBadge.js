import React from 'react';
import './SuccessorBadge.css';

const SuccessorBadge = ({ type }) => {
  return (
    <span className={`badge badge-${type}`}>
      {type === 'internal' ? '内部候補' : '外部候補'}
    </span>
  );
};

export default SuccessorBadge;
