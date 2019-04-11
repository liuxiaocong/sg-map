import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.css';

const AutoComplete = ({ source, showAutoComplete, value, onChange, onHasError }) => {
  let suggestions = [];
  let hasError = false;
  if (value) {
    suggestions = _.filter(source, (stationsName) => {
      return stationsName.toLowerCase().indexOf(value.toLowerCase()) >= 0;
    });
    if (suggestions.length === 0) {
      hasError = true;
    }
    for (let i = 0; i < source.length; i++) {
      if (source[i] === value) {
        suggestions = [];
        hasError = false;
      } else if (source[i].toLowerCase() === value.toLowerCase()) {
        suggestions = [];
        hasError = false;
        onChange(source[i]);
      }
    }
  }
  return (
    <div className={ showAutoComplete && suggestions.length > 0 ? 'auto-complete-wrap auto-complete-wrap-up' : 'auto-complete-wrap' }>
      <input className="input-item"
             value={ value }
             onChange={ (e) => {
               onChange(e.target.value);
             } }/>
      <div className={ showAutoComplete && suggestions.length > 0 ? 'complete-wrap' : 'complete-none' }>
        <ul className="suggestion-wrap">
          {
            suggestions.map((value, inx) => (
              <li key={ `_${inx}` } onClick={ () => {
                onChange(value);
              } } className="suggestion-item">{ value }</li>
            ))
          }
        </ul>
      </div>
      <div className={ hasError ? 'has-error-wrap' : 'has-error-none' }>
        Please input correct station
      </div>
    </div>
  );
};

AutoComplete.propTypes = {
  source: PropTypes.array,
  showAutoComplete: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.string,
};

export default AutoComplete;
