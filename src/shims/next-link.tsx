import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

type Props = React.ComponentProps<typeof RouterLink> & {
  href: string;
  prefetch?: boolean;
};

export default function Link({ href, prefetch, ...rest }: Props) {
  const { to, ...otherProps } = rest as any;
  return <RouterLink to={href} {...otherProps} />;
}