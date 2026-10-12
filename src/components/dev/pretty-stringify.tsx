interface Props {
  data: any;
}

export function PrettyStringify({ data }: Props) {
  return <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
}
