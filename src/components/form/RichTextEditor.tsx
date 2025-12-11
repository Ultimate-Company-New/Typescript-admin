import type React from 'react';
import { useMemo } from 'react';

import { Box, FormHelperText, InputLabel } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import styles from '../../styles/FormInput.module.scss';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

/**
 * Rich Text Editor Component
 * WYSIWYG editor using React Quill for formatted text input
 * Features:
 * - Bold, Italic, Underline
 * - Headers (H1, H2, H3)
 * - Lists (ordered, unordered)
 * - Links
 * - Text alignment
 * - Clean/Remove formatting
 * - Outputs HTML for storage
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  error = false,
  helperText,
  disabled = false,
  required = false,
  placeholder = 'Enter text...',
}) => {
  // Quill editor modules configuration
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link'],
        ['clean'],
      ],
    }),
    [],
  );

  // Quill editor formats
  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'align',
    'link',
  ];

  return (
    <Box className={styles['rich-text-editor-wrapper']}>
      <InputLabel
        required={required}
        error={error}
        sx={{
          color: error ? 'error.main' : 'rgba(0, 0, 0, 0.6)',
          fontSize: '0.75rem',
          fontWeight: 400,
          mb: 0.5,
        }}
      >
        {label}
      </InputLabel>
      <Box
        className={`${styles['rich-text-editor']} ${error ? styles['rich-text-editor--error'] : ''} ${disabled ? styles['rich-text-editor--disabled'] : ''}`}
      >
        <ReactQuill
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          theme="snow"
        />
      </Box>
      {helperText && (
        <FormHelperText error={error} sx={{ ml: 1.75, mt: 0.5 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default RichTextEditor;

