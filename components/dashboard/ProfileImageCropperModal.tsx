'use client';

import React from 'react';
import ImageCropperModal, { ImageCropperModalProps } from './ImageCropperModal';

export default function ProfileImageCropperModal(props: Omit<ImageCropperModalProps, 'mode'>) {
  return <ImageCropperModal {...props} mode="profile" />;
}
