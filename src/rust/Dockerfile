FROM rust:1.35 as build

RUN USER=root rustup default nightly-2019-07-16

RUN cd / && \
  mkdir -p smmdb && \
  USER=root cargo init --bin smmdb
WORKDIR /smmdb

COPY ./Cargo.toml ./Cargo.toml
COPY ./Cargo.lock ./Cargo.lock
RUN mkdir ./src/rust
RUN echo "fn main() {}" >> ./src/rust/main.rs

RUN cargo fetch
RUN cargo build --release
RUN rm src/*.rs

COPY ./src/rust ./src/rust
COPY ./src/swagger ./src/swagger

RUN rm ./target/release/deps/smmdb*
RUN cargo build --release

FROM debian:jessie-slim

COPY --from=build /smmdb/target/release/smmdb .

ENV DOCKER=true
EXPOSE 3030
CMD ["./smmdb"]
