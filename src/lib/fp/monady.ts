export interface Either<E, A> {
  map<B>(fn: (value: A) => B): Either<E, B>;
  mapLeft<F>(fn: (error: E) => F): Either<F, A>;
  chain<B>(fn: (value: A) => Either<E, B>): Either<E, B>;
  fold<B>(onLeft: (error: E) => B, onRight: (value: A) => B): B;
  getOrElse(zapasowy: A): A;
  isLeft(): boolean;
}

export class Right<E, A> implements Either<E, A> {
  constructor(private readonly value: A) {}

  map<B>(fn: (value: A) => B): Either<E, B> {
    return new Right<E, B>(fn(this.value));
  }

  mapLeft<F>(): Either<F, A> {
    return new Right<F, A>(this.value);
  }

  chain<B>(fn: (value: A) => Either<E, B>): Either<E, B> {
    return fn(this.value);
  }

  fold<B>(_onLeft: (error: E) => B, onRight: (value: A) => B): B {
    return onRight(this.value);
  }

  getOrElse(): A {
    return this.value;
  }

  isLeft(): boolean {
    return false;
  }
}

export class Left<E, A> implements Either<E, A> {
  constructor(private readonly error: E) {}

  map<B>(): Either<E, B> {
    return new Left<E, B>(this.error);
  }

  mapLeft<F>(fn: (error: E) => F): Either<F, A> {
    return new Left<F, A>(fn(this.error));
  }

  chain<B>(): Either<E, B> {
    return new Left<E, B>(this.error);
  }

  fold<B>(onLeft: (error: E) => B): B {
    return onLeft(this.error);
  }

  getOrElse(zapasowy: A): A {
    return zapasowy;
  }

  isLeft(): boolean {
    return true;
  }
}

const MakeRight = <E, A>(value: A): Either<E, A> => new Right<E, A>(value);

const MakeLeft = <E, A>(error: E): Either<E, A> => new Left<E, A>(error);

const ToError = (rzucone: unknown): Error =>
  rzucone instanceof Error ? rzucone : new Error(String(rzucone));

const TryCatch = <A>(fn: () => A): Either<Error, A> => {
  try {
    return MakeRight(fn());
  } catch (rzucone) {
    return MakeLeft(ToError(rzucone));
  }
};

export const Either = {
  right: MakeRight,
  left: MakeLeft,
  tryCatch: TryCatch,
};

export const Sequence = <E, A>(eithers: ReadonlyArray<Either<E, A>>): Either<E, A[]> =>
  eithers.reduce<Either<E, A[]>>(
    (acc, either) => acc.chain((values) => either.map((value) => [...values, value])),
    MakeRight([]),
  );
export interface Maybe<A> {
  map<B>(fn: (value: A) => B | null | undefined): Maybe<B>;
  chain<B>(fn: (value: A) => Maybe<B>): Maybe<B>;
  getOrElse(zapasowy: A): A;
  fold<B>(onNothing: () => B, onJust: (value: A) => B): B;
  isJust(): boolean;
}

export class Just<A> implements Maybe<A> {
  constructor(private readonly value: A) {}

  map<B>(fn: (value: A) => B | null | undefined): Maybe<B> {
    return MaybeFrom(fn(this.value));
  }

  chain<B>(fn: (value: A) => Maybe<B>): Maybe<B> {
    return fn(this.value);
  }

  getOrElse(): A {
    return this.value;
  }

  fold<B>(_onNothing: () => B, onJust: (value: A) => B): B {
    return onJust(this.value);
  }

  isJust(): boolean {
    return true;
  }
}

export class Nothing<A> implements Maybe<A> {
  map<B>(): Maybe<B> {
    return new Nothing<B>();
  }

  chain<B>(): Maybe<B> {
    return new Nothing<B>();
  }

  getOrElse(zapasowy: A): A {
    return zapasowy;
  }

  fold<B>(onNothing: () => B): B {
    return onNothing();
  }

  isJust(): boolean {
    return false;
  }
}

const MakeJust = <A>(value: A): Maybe<A> => new Just(value);

const MakeNothing = <A>(): Maybe<A> => new Nothing<A>();

const MaybeFrom = <A>(value: A | null | undefined): Maybe<A> =>
  value === null || value === undefined ? MakeNothing<A>() : MakeJust(value);

export const Maybe = {
  just: MakeJust,
  nothing: MakeNothing,
  fromNullable: MaybeFrom,
};
