export const validateCourseForm = (data) => {
  const errors = {};

  if (!data.name?.trim()) {
    errors.name = 'Course name is required';
  } else if (data.name.length < 2) {
    errors.name = 'Course name must be at least 2 characters';
  }

  if (!data.description?.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (!data.duration || data.duration < 1) {
    errors.duration = 'Valid duration is required';
  }

  if (!data.faculty?.trim()) {
    errors.faculty = 'Faculty is required';
  }

  if (!data.seats || data.seats < 1) {
    errors.seats = 'Number of seats is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateJobForm = (data) => {
  const errors = {};

  if (!data.title?.trim()) {
    errors.title = 'Job title is required';
  }

  if (!data.description?.trim()) {
    errors.description = 'Job description is required';
  }

  if (!data.requirements || !Array.isArray(data.requirements) || data.requirements.length === 0) {
    errors.requirements = 'At least one requirement is required';
  }

  if (!data.deadline) {
    errors.deadline = 'Application deadline is required';
  } else if (new Date(data.deadline) <= new Date()) {
    errors.deadline = 'Deadline must be in the future';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateApplication = (data) => {
  const errors = {};

  if (!data.courseId) {
    errors.courseId = 'Course selection is required';
  }

  if (!data.grades || Object.keys(data.grades).length === 0) {
    errors.grades = 'Grade information is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};