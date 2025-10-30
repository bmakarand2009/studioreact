import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

type Props = React.ComponentProps<typeof RouterLink> & {
  href: string;
  prefetch?: boolean;
};

export default function Link({ href, prefetch, ...rest }: Props) {
  return <RouterLink to={href} {...rest} />;
}